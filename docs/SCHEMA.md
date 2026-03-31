# Saved Content Inbox Schema

## Status enum

`saved_item_status`

- `inbox`
- `read_next`
- `reading`
- `completed`
- `reference`
- `archived`

## Source enum

`saved_item_source`

- `manual`
- `reddit`
- `linkedin`

## AI summary enum

`ai_summary_status`

- `idle`
- `pending`
- `complete`
- `failed`

## Main table

### `saved_items`

Purpose: the normalized, user-facing content record used by all V1 workflows.

Columns:

- `id uuid primary key`
- `user_id uuid not null`
- `title text`
- `canonical_url text not null`
- `original_url text not null`
- `url_hash text not null`
- `source_type saved_item_source not null`
- `source_external_id text`
- `source_payload jsonb`
- `source_domain text`
- `author_name text`
- `excerpt text`
- `note text`
- `tags text[] not null default '{}'`
- `ai_summary text`
- `ai_summary_status ai_summary_status not null default 'idle'`
- `status saved_item_status not null default 'inbox'`
- `saved_at timestamptz`
- `published_at timestamptz`
- `queued_at timestamptz`
- `archived_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- `unique (user_id, url_hash)`

Indexes:

- `(user_id, status)`
- `(user_id, source_domain)`
- `(user_id, saved_at desc)`
- `gin(tags)`

## Import audit table

### `import_uploads`

Purpose: light history of uploaded imports for visibility and debugging.

Columns:

- `id uuid primary key`
- `user_id uuid not null`
- `source_type saved_item_source not null`
- `filename text not null`
- `item_count integer not null default 0`
- `imported_count integer not null default 0`
- `duplicate_count integer not null default 0`
- `created_at timestamptz not null default now()`

## Dedupe logic

The app dedupes per user using URL normalization plus hashing.

Normalization rules:

- force absolute URL
- lowercase hostname
- strip hash fragment
- remove common tracking params
- normalize trailing slash

Hashing:

- `url_hash = sha256(canonical_url)`

Behavior:

- if no existing row with `(user_id, url_hash)`, insert a new item
- if a row exists, merge tags and fill missing metadata instead of creating a duplicate

## Why this schema is enough for V1

- Tags are simple text arrays instead of a many-to-many tag system
- Notes are a single text field instead of a separate notes model
- Import provenance stays in `source_payload jsonb`
- We avoid background-job tables, extraction tables, and event logs until usage proves they are needed
