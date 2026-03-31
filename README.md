# Saved Content Inbox

A personal web app to import saved posts/links from Reddit, LinkedIn, and manual URLs, then organize and actually read them.

## Features

- **Auth** - Email/password sign-up and sign-in via Supabase Auth
- **Manual URL save** - Paste any URL with optional title, tags, note, and status
- **Reddit import** - Upload JSON exports of saved posts
- **LinkedIn import** - Upload CSV exports with URL columns
- **Inbox/Queue/Archive** - Triage items through a reading workflow
- **Search & filter** - Filter by source, status, tag, or free text search
- **Tags & notes** - Organize items with tags and personal notes
- **AI summaries** - On-demand GPT-4o-mini summaries to help with triage
- **Deduplication** - URLs are canonicalized and hashed; duplicates merge metadata

## Stack

- **Next.js 16** (App Router, server actions)
- **React 19**
- **Supabase** (Postgres + Auth + RLS)
- **OpenAI API** (gpt-4o-mini for summaries)
- **TypeScript** (strict mode)
- **Zod** (input validation)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note:
- Project URL
- Anon/publishable key
- Service role key

### 3. Run the schema

Open the Supabase SQL Editor and paste the contents of `supabase/schema.sql`. Run it.

### 4. Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start saving content.

## Item statuses

| Status | Purpose |
|--------|---------|
| `inbox` | Default landing spot for new saves and imports |
| `read_next` | Deliberately queued for reading soon |
| `reading` | Currently being read |
| `completed` | Finished reading |
| `reference` | Keeping for reference, not necessarily to read |
| `archived` | Done or no longer relevant |

## Import formats

### Reddit
Upload a JSON file. The importer handles these shapes:
- Array of post objects
- Object with `children` or `data` array
- Each post can have `data` wrapper (Reddit API style)

### LinkedIn
Upload a CSV with a header row. The importer looks for URL columns named `URL`, `Url`, `Link`, or `url`, and optionally maps `Title`, `Author`, `Description`, etc.

## Deduplication

URLs are canonicalized before saving:
- Lowercase hostnames
- Strip hash fragments
- Remove tracking params (utm_*, fbclid, gclid, etc.)
- Normalize trailing slashes
- SHA-256 hash for uniqueness check per user

When a duplicate is detected during import, tags are merged and empty fields are filled from the incoming data rather than creating a new row.

## Project structure

```
app/              Next.js App Router pages and actions
  (app)/          Authenticated routes (inbox, queue, archive, imports, items)
  auth/           Login/signup
components/       Reusable UI components
lib/              Core logic
  items.ts        Parsers, normalization, dedup merge
  queries.ts      Database queries
  types.ts        TypeScript types and constants
  utils.ts        URL canonicalization, helpers
  openai.ts       OpenAI client
  supabase/       Supabase client factories
supabase/
  schema.sql      Database schema (tables, RLS, indexes, triggers)
```
