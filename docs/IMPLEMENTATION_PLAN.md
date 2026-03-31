# Phased Implementation Plan

## Phase 1: Project scaffold

Goal: create a working app shell and environment baseline.

Deliverables:

- Next.js app scaffold
- global styles and layout
- Supabase client utilities
- auth entry point
- docs and environment template

Exit criteria:

- app boots locally
- auth page and protected app shell exist

## Phase 2: Database and normalized domain model

Goal: define the simplest schema that supports all V1 workflows.

Deliverables:

- `saved_items` schema
- `import_uploads` schema
- enums for status, source, and AI summary state
- RLS policies
- indexes and updated-at trigger

Exit criteria:

- schema applies cleanly in Supabase
- a single saved item row can represent manual and imported content

## Phase 3: Ingestion pipeline

Goal: support the three V1 capture paths with shared normalization and dedupe.

Deliverables:

- manual URL capture flow
- Reddit JSON parser
- LinkedIn CSV parser
- URL canonicalization
- dedupe hash generation
- insert-or-merge persistence logic

Exit criteria:

- manual save works
- Reddit import works on a representative file
- LinkedIn upload works on a representative file
- re-import does not create duplicates for the same user

## Phase 4: Reading workflow UI

Goal: make the app useful even with a modest number of items.

Deliverables:

- inbox screen
- read-next screen
- archive screen
- item detail page
- status transitions
- tags and notes editing
- search and filter controls

Exit criteria:

- user can review imported items
- user can move items through statuses
- user can tag, note, and find items quickly

## Phase 5: AI summaries

Goal: add lightweight assistance without complicating the core workflow.

Deliverables:

- OpenAI client wrapper
- on-demand summary generation
- persisted summary text and status

Exit criteria:

- user can request a summary for an item
- summary failures do not break the rest of the app

## Phase 6: Polish and setup

Goal: make the MVP understandable and handoff-ready.

Deliverables:

- setup documentation
- import expectations documentation
- future-features TODO list
- small UX fixes from manual testing

Exit criteria:

- another developer can boot the app from docs
- the scope of V1 and post-V1 is clearly documented
