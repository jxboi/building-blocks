# Plan — AI Integration

## Purpose
The substrate AI features run on — provider abstraction, usage metering, tenant governance, and safety guardrails — built once so inheriting projects add AI *features* (summarise, draft, classify, semantic search) as vertical slices without re-solving cost tracking, opt-outs, or streaming. The shell ships **no user-facing AI features**.

## Decisions

### Provider seam
- **`IAiGateway`** — thin wrapper over `Microsoft.Extensions.AI` abstractions (`IChatClient`, embeddings): chat/completion, structured output, embeddings, streaming. Adapters config-selected per environment (Anthropic, OpenAI, Azure OpenAI, Bedrock — one class each, same pattern as email providers); **deterministic fake provider** for dev/tests (canned responses keyed by feature — CI never calls a real model).
- **Model tiers, not model names, in code:** features request `fast` | `balanced` | `powerful`; tier→concrete-model mapping lives in configuration so model upgrades are config changes, never code hunts. No model IDs or pricing hardcoded anywhere.

### AI feature registry (standard pattern)
Each AI feature registers: key, purpose description (shown to org admins), model tier, token budget per invocation, whether output is shown-as-suggestion vs acts-on-data. Registration wires it automatically into metering, governance, and flags (every AI feature gets a kill switch and rollout control via feature-flags for free).

### Metering & cost control
- **`ai_usage` row per call** (org, user, feature, tokens in/out, latency, provider, estimated cost — partitioned, retention job). Aggregations power: org-facing usage page, admin console per-org view, and **plan entitlements** (`ai_credits`/month via billing-hooks) with the standard over-limit behaviour (block + upgrade CTA).
- Platform budget alert (spend spike per org/feature) via the observability alert baseline.

### Governance & tenancy
- **Org-level AI opt-out** (settings registry: `ai.enabled`, plus per-feature overrides) — table stakes for enterprise customers; the gateway enforces it, not the callers.
- **Data discipline:** prompts are built from **field-policy-shaped DTOs only** — guarded fields never reach a model (same rule as exports/indexes/audit). Prompt payloads are not logged by default (metering stores counts, not content); a per-feature debug flag enables sampled logging in non-production only.
- AI invocations that *act on data* (registry flag) emit audit events; pure suggestions don't.
- Demo mode forces the fake provider (seed-data-demo restrictions).

### Safety boundary
- **Model output is untrusted input.** AI never gets ambient authority: anything an AI feature writes or triggers goes through the same permission-checked endpoints/commands as the user it acts for — never a privileged internal path. Text from models is treated like user input everywhere (validated, encoded, never executed).
- Tool-use/agentic loops, if a project builds them, must route each tool call through normal authorization; the plan records this as the rule, the shell doesn't ship an agent framework.

### Execution patterns
- **Streaming:** SSE from API through the Next.js BFF proxy; shared frontend hook (`useAiStream`) with abort/retry; graceful non-streaming fallback.
- **Long generations:** background jobs + notification on completion (existing patterns).
- **Embeddings/semantic search (optional):** `pgvector` extension + an embedding pipeline off the same outbox events search uses; slots in as an additional `ISearchIndex` capability. Off by default; the seam exists so enabling it is additive.

### Prompt management
Prompts are code (versioned, reviewed, typed model params), not a DB editor. Each AI feature ships **golden tests** against the fake provider (contract shape) and a small optional eval script against real providers (run manually/nightly, never in PR CI).

## Data model (schema `ai`)
`ai_usage` (partitioned monthly, 13-month retention), tier→model mapping and org opt-outs live in configuration and the settings registry respectively — no other tables.

## Endpoints (`/api/v1`)
me/orgs AI usage summaries (`ai.usage.read`), admin console per-org usage + spend view; feature endpoints belong to the features, not this module.

## Non-goals
Chat assistant product, agent/orchestration framework, RAG pipeline, fine-tuning, prompt playgrounds, eval platforms, provider price books. All product verticals or external tools; the substrate doesn't preclude any of them.

## Removal notes
Optional module: no other module depends on it. Delete folder + registry entries; `pgvector` migration is separate and skippable.

## Milestones
1. `IAiGateway` + one real adapter + fake provider + tier mapping.
2. Feature registry + flags integration + org opt-out enforcement.
3. Metering + entitlements + usage surfaces (org + admin).
4. SSE streaming path + `useAiStream` + one reference feature slice (e.g. "summarise activity feed") proving the whole path.
5. Optional: pgvector embedding pipeline behind the search seam.
