# Saved Content Inbox

Saved Content Inbox is a lean MVP for importing saved content from a few practical sources, then moving it through an inbox-to-reading workflow.

## What V1 includes

- Supabase Auth with email/password
- Manual URL save
- Reddit saved export import
- LinkedIn export upload
- Normalized saved item schema
- Inbox, Read Next, and Archive screens
- Search, filters, tags, notes
- Basic AI summaries with OpenAI

## Stack

- Next.js App Router
- Supabase Auth + Postgres
- Postgres row-level security
- OpenAI API for summaries

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

3. Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

4. In Supabase SQL Editor, run [supabase/schema.sql](/Users/katespurr/Documents/New project/supabase/schema.sql).

5. Start the app:

```bash
npm run dev
```

## Import expectations

### Reddit

- Upload a JSON file from a Reddit saved export or a compatible dump containing saved post/link objects.
- The app extracts URLs, titles, authors, timestamps, and the raw payload for reference.

### LinkedIn

- Upload a CSV export that includes a URL column such as `URL`, `Link`, or `Url`.
- The importer keeps the row payload and maps title, author, description, and saved date when present.

### Manual

- Paste any URL, optionally add a title, note, tags, and target status.
- The app attempts lightweight metadata extraction from the page title and description.

## Dedupe behavior

- URLs are canonicalized before insert.
- Common tracking params are stripped.
- Hash fragments are ignored.
- Trailing slashes are normalized.
- A per-user unique constraint on `url_hash` prevents duplicate saves.
- Re-imports merge tags and fill in missing metadata instead of creating new rows.

## Product stance

This MVP intentionally favors a simple hybrid ingestion model and a usable triage workflow over broad platform coverage or deep content processing.
