# Folder Structure

```text
saved-content-inbox/
  app/
    (app)/
      archive/
      imports/
      inbox/
      items/[id]/
      queue/
      layout.tsx
      page.tsx
    auth/
      actions.ts
      page.tsx
    actions.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    app-shell.tsx
    filter-bar.tsx
    item-card.tsx
    item-list.tsx
    sidebar-nav.tsx
    status-badge.tsx
  docs/
    ARCHITECTURE_PLAN.md
    FOLDER_STRUCTURE.md
    IMPLEMENTATION_PLAN.md
    SCHEMA.md
  lib/
    items.ts
    openai.ts
    queries.ts
    types.ts
    utils.ts
    supabase/
      admin.ts
      browser.ts
      middleware.ts
      server.ts
  supabase/
    schema.sql
  .env.example
  .gitignore
  middleware.ts
  next.config.ts
  package.json
  README.md
  TODO.md
  tsconfig.json
```

## Responsibilities by folder

### `app/`

- route structure
- server-rendered screens
- server actions for write operations

### `components/`

- reusable UI components with no data ownership

### `lib/`

- normalization logic
- parsers
- query helpers
- Supabase clients
- OpenAI wrapper
- shared types and utilities

### `supabase/`

- SQL schema and database setup artifacts

### `docs/`

- planning and setup documents kept close to the implementation
