create extension if not exists pgcrypto;

create type public.saved_item_status as enum (
  'inbox',
  'read_next',
  'reading',
  'completed',
  'reference',
  'archived'
);

create type public.saved_item_source as enum (
  'manual',
  'reddit',
  'linkedin'
);

create type public.ai_summary_status as enum (
  'idle',
  'pending',
  'complete',
  'failed'
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  canonical_url text not null,
  original_url text not null,
  url_hash text not null,
  source_type public.saved_item_source not null,
  source_external_id text,
  source_payload jsonb,
  source_domain text,
  author_name text,
  excerpt text,
  note text,
  tags text[] not null default '{}',
  ai_summary text,
  ai_summary_status public.ai_summary_status not null default 'idle',
  status public.saved_item_status not null default 'inbox',
  saved_at timestamptz,
  published_at timestamptz,
  queued_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, url_hash)
);

create table if not exists public.import_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type public.saved_item_source not null,
  filename text not null,
  item_count integer not null default 0,
  imported_count integer not null default 0,
  duplicate_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists saved_items_user_status_idx on public.saved_items (user_id, status);
create index if not exists saved_items_user_domain_idx on public.saved_items (user_id, source_domain);
create index if not exists saved_items_user_saved_at_idx on public.saved_items (user_id, saved_at desc);
create index if not exists saved_items_tags_gin_idx on public.saved_items using gin (tags);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists saved_items_set_updated_at on public.saved_items;
create trigger saved_items_set_updated_at
before update on public.saved_items
for each row
execute function public.set_updated_at();

alter table public.saved_items enable row level security;
alter table public.import_uploads enable row level security;

create policy "users can manage their own saved items"
on public.saved_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can read their own imports"
on public.import_uploads
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
