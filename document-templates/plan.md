# Plan — Document Templates (PDF form generation)

## Purpose
Org admins upload a PDF (a contract, application form, certificate, letter), define where values go, and the system generates filled, flattened PDFs on demand — single or in batches. Fields and positions are fully customisable through a visual designer. Optional module; nothing else depends on it.

## Boundary vs reports
Reports **create** documents from data (QuestPDF/CSV/XLSX layouts authored in code). Document templates **fill** customer-supplied PDFs at runtime-defined positions. Different authors (developer vs org admin), different engines — deliberately separate modules that share the files/jobs plumbing.

## Decisions

### Two fill modes, auto-detected per template
- **AcroForm mode** — the uploaded PDF already contains form fields: the system enumerates them on upload and the admin just maps each field to a binding. Robust, no positioning needed; preferred when available.
- **Overlay mode** — flat PDF with no fields: the admin places fields visually; generation stamps text/marks at the stored coordinates. This is the "customisable fields and positions" path.

### Visual designer (overlay mode)
- **pdf.js renders pages client-side** (no server rendering pipeline); the admin drags/resizes field boxes over the page image; snap guides + copy-position-across-pages.
- Coordinates stored **normalised to page dimensions** (page index + % x/y/w/h) — resolution- and DPI-independent, robust to re-rendering.
- Per-field: name, type (`text | date | number | checkbox | image`), font family/size (embedded font subset list), alignment, format mask (dates/numbers, locale-aware via the org's locale), required flag, max length with shrink-to-fit or overflow warning.
- Live preview with sample values before saving; template versioning (edits create a new version; generation records which version it used).

### Data binding (registry pattern, as everywhere)
Each field binds to one of:
1. **Manual input** — provided at generation time (the generate form is auto-built from these, via the form kit, with validation from the field defs);
2. **Data-source key** — a **document data-source registry**: core registers `org.*`, `member.*` (name, email), `date.today`; modules/products register theirs (`task.*`, `billing.plan_name`, product entities). Same declare-once pattern as permissions/settings — a vertical adds bindable keys without touching this module;
3. **Static value** — fixed text per template.

### Generation
- `POST /generate` with template id + entity context + manual values → validated against field defs → **background job** (PDFsharp-class MIT-licensed library: fills AcroForms or stamps overlay text, embeds fonts, **flattens** output) → stored via file-uploads (`generated-document` purpose, inherits quotas/ACL/retention) → notification with download link. Small templates return synchronously under a size/time threshold; batch always async.
- **Batch generation**: rows (CSV upload or a registered list source, e.g. "all members") × template → one job, zip or per-row files, progress via job status, report-pipeline-style completion notification.
- Generated documents are **immutable snapshots** (values + template version recorded in metadata) — regeneration is a new document.

### Tenancy, permissions, safety
- Templates and outputs org-scoped like everything else. Permissions: `documents.templates.manage` (design), `documents.generate` (use). Both audited; generation events at `member` visibility.
- Uploaded template PDFs pass the standard file pipeline (mime sniff, AV seam); the fill engine never executes embedded JS and strips it from output.
- Field-policy discipline holds: data-source resolution runs through shaped DTOs — a binding can't leak a guarded field the generating user couldn't see.

## Data model (schema `docs`)
`template` (org_id, name, file_id, mode, active_version), `template_version` (template_id, version, field_defs JSONB — the normalised field list, created_by), `generation` (org_id, template_version_id, requested_by, context JSONB, output_file_id, status, batch_id?).

## Endpoints (`/api/v1`)
templates (CRUD, upload+detect, versions), templates/{id}/fields (designer save), templates/{id}/preview (sample fill), generate (single/batch), generations (list/status/download).

## Frontend
Template list + upload; **designer** (pdf.js canvas, field palette, properties panel, preview); generate form (auto-built from manual fields + entity picker for data-source context); generations history with the filter kit.

## Non-goals (documented escape hatches)
E-signatures (integrate DocuSign/Dropbox Sign via the connections vault later — outputs are their input), Word/HTML template engines (future extension of this module, same binding registry), OCR/auto-detection of blank boxes on scanned forms (a product decision; the designer is the answer until then), rich text flow/repeating table regions (that's report authoring — QuestPDF side).

## Milestones
1. Template upload + AcroForm detection + mapping UI + single generation (sync) + flatten.
2. Overlay designer (pdf.js, normalised coords) + stamping engine + preview.
3. Data-source registry + auto-built generate form + validation/format masks.
4. Async + batch generation + history + notifications.
5. Versioning, audit polish, JS-stripping hardening, seed/demo templates.
