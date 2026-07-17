# Plan — File Uploads

## Purpose
Safe, tenant-isolated file storage with direct-to-storage uploads, lifecycle management, and an attachment abstraction any feature (avatars, workspace files, product entities) can reuse.

## Decisions
- **S3-compatible object storage** behind `IFileStorage` (presign PUT/GET, delete, copy). Dev: MinIO in compose. Prod: S3/R2/GCS-interop — deployment choice, not code choice.
- **Direct-to-storage uploads:** client asks API for a presigned PUT (declaring filename, size, mime, purpose) → API validates policy (size caps, mime allowlist per purpose, org quota) → returns presigned URL + `file` row in `pending` state → client uploads → client confirms (or storage-event/sweeper reconciles) → state `stored`.
- **Keys are opaque:** `org/{orgId}/{fileId}` — original filename lives only in metadata; served filename set via content-disposition on presigned GET. Prevents path games and tenant leakage.
- **Per-file access:** files register with the resource-ACL pattern (`IResourceAuthorizer`, see roles-permissions plan) — visibility `workspace` by default, `private` + user/team share grants supported; file-uploads is the reference integration for that pattern.
- **Downloads:** always short-lived presigned GETs issued after a permission + resource-ACL check; no public buckets. Avatar/public assets get a long-lived variant behind an explicit `public` purpose.
- **Purposes registry:** `avatar`, `workspace-file`, `import`, `export`, plus product-defined purposes; each declares max size, allowed mime types, retention, and required permission — the reuse seam for inheriting projects.
- **Validation & safety:** server-side mime sniffing on confirm (magic bytes vs declared type), image re-encode for avatars (strips EXIF), **antivirus seam** (`IFileScanner`, no-op dev implementation, ClamAV container optional) — files stay `quarantined` until scan passes if scanner enabled.
- **Quotas:** per-organisation storage quota tracked on confirm/delete; enforced at presign time; surfaced in org settings + billing hooks.
- **Lifecycle:** soft-delete → purge job after grace period; orphan sweeper for never-confirmed pendings; org purge cascades file deletion.

## Operations & administration
- **Org admins** manage storage through the app: usage page (bytes used vs plan entitlement, breakdown by purpose/workspace), per-file actions via the sharing/delete UIs, restore within the soft-delete grace window. Purpose policies (size caps, mime allowlists) are **code-registered, not org-editable** — orgs get quota control, not policy editing.
- **Platform admins** get an admin console **Storage** surface: usage by org (top-N + trend), quota overrides (audited), quarantined-files queue (release/purge), orphan-sweep and purge-job stats.
- **Metrics/alerts:** total + per-org growth rate, orphan count, scanner queue depth feed the observability baseline; storage headroom is already a watchdog signal.
- **DR for objects (documented, not optional):** the database backup does **not** cover file content — deployments must enable provider-side durability (bucket versioning + soft-delete window; cross-region replication where the project warrants it). `file` rows carry checksums, so an integrity-audit job (sampled) can detect DB↔bucket drift. Restore runbook: bucket restore + row reconciliation.
- **Provider migration:** keys are opaque and provider-agnostic, so moving providers is `rclone` sync + config switch — runbook documented (`docs/runbooks/storage-migration.md`); dual-read fallback flag (`old provider on 404`) for zero-downtime cutover.
- **Image pipeline (`IImageVariant`, on for image purposes):**
  - **Variants are declared per purpose** (avatar: 64/256; image-content purposes: thumb 320 / display 1600 / original), generated on confirm via background jobs, **re-encoded to WebP** (AVIF as a config upgrade), stripped of EXIF, stored under the same opaque key scheme (`…/{fileId}/v/{variant}`). Pre-generated only — **no on-demand transform service** (that's an image CDN's job; imgix/Cloudflare Images is the documented escape hatch, slotting in front of the same variant URLs).
  - **LQIP placeholder:** a ~20px blurred base64 preview stored on the `file` row at processing time — the frontend paints it instantly while the real variant loads (no layout shift, no grey boxes).
  - **Client-side pre-compression (upload kit contract):** purposes declare a max dimension/quality; the browser downscales and re-encodes oversized photos *before* upload (canvas re-encode) — a 12MB phone photo becomes ~400KB before it touches the network. Server-side validation still re-checks (client is an optimisation, never the enforcement).
- **Image delivery & caching (resolves the presign-vs-cache tension):**
  - `public`-purpose images (avatars, org logos): long-lived immutable URLs (variant key includes content hash) + `Cache-Control: public, max-age=1y` — browser/CDN cache them like static assets; a changed avatar is a *new* URL.
  - Private images: a stable app route (`/img/{fileId}/{variant}`) does the permission check and 302s to a presigned URL signed with **expiry-bucketed windows** (signature parameters rounded to the next 6h boundary) — the redirect target stays byte-identical within the window, so the browser caches the image instead of re-downloading per page view; `Cache-Control: private, max-age` aligned to the bucket. Revocation worst-case = one bucket window, consistent with the shell's staleness-bound philosophy.

## Data model (schema `files`)
`file` (org_id, workspace_id?, uploader_id, purpose, key, name, size, mime, status: pending/stored/quarantined/deleted, checksum, created_at, deleted_at), `org_storage_usage` (org_id, bytes_used — maintained transactionally).

## Endpoints (`/api/v1`)
files/presign-upload, files/{id}/confirm, files/{id} (metadata get, delete), files/{id}/download-url, orgs/{id}/storage-usage.

## Events published
`FileStored`, `FileDeleted`, `FileQuarantined` (→ audit, notifications, search indexing of metadata).

## Milestones
1. IFileStorage + MinIO + presign flow + confirm + tests.
2. Purpose registry, validation, avatar pipeline.
3. Quotas + usage tracking.
4. Lifecycle jobs (orphans, purge) + scanner seam.
