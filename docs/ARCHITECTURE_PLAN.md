# Saved Content Inbox Architecture Plan

## Product goal

Build a lean personal web app where a user imports saved content from a small set of high-value sources, triages it into a simple workflow, and later reads or archives it.

## V1 product principles

- Keep ingestion hybrid, not universal
- Normalize everything into one saved item model
- Optimize for triage and reading, not discovery
- Prefer a few clear statuses over automation-heavy workflows
- Store enough source provenance for debugging and reprocessing, but not a full ingestion platform

## Core architecture

### Frontend

- Next.js App Router
- Server components for data-heavy screens
- Server actions for writes: imports, status changes, notes, tags, summaries
- Minimal custom UI, no heavy component framework required for MVP

### Auth

- Supabase Auth
- Email/password for MVP
- Protected app area behind authenticated layout

### Database

- Supabase Postgres
- One main `saved_items` table for the normalized content model
- One light `import_uploads` table for auditability of uploads
- RLS to keep data per-user

### Ingestion model

- Manual URL save
- Reddit JSON import
- LinkedIn CSV upload
- Each ingestion path converts source-specific payloads into a shared normalized object
- Shared dedupe path canonicalizes URLs and merges re-imports

### AI layer

- OpenAI API only for short summaries in V1
- Summary generation runs on demand from an item detail view
- No background worker required for MVP

## Request/data flow

1. User signs in with Supabase Auth.
2. User saves a manual URL or uploads a Reddit/LinkedIn export.
3. The source parser maps source data into a normalized ingestion object.
4. URL canonicalization and hashing run before persistence.
5. Existing item by `user_id + url_hash` is updated instead of duplicated.
6. Items land in `inbox` by default unless the user explicitly chooses another status.
7. The user moves items between `inbox`, `read_next`, `reading`, `completed`, `reference`, and `archived`.
8. On an item page, the user edits tags and notes or requests an AI summary.

## Key design decisions

### Why one main content table

For V1, tags, notes, summaries, status, and source metadata can live on the same row. This keeps queries simple and the UI fast to build.

### Why not background jobs yet

Imports are user-initiated and small enough for synchronous MVP handling. AI summaries can also be requested manually. This avoids queue infrastructure too early.

### Why not store extracted article content yet

The goal is to organize and revisit saved content first. Full content extraction and reader mode can come later once the core behavior is validated.

## Risks and boundaries

- LinkedIn exports vary, so the parser should accept a few common header variants
- Manual metadata extraction from arbitrary URLs should be best-effort only
- Reddit imports may contain posts and comments with slightly different payload shapes
- OpenAI summaries should be optional and never block the rest of the workflow

## V1 success criteria

- A user can sign in
- A user can import Reddit saves
- A user can upload a LinkedIn export
- A user can save any manual URL
- Duplicate URLs do not create duplicate items for the same user
- A user can search, filter, tag, note, queue, and archive items
- A user can generate a lightweight summary for an item
