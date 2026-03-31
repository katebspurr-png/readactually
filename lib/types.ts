export const STATUSES = [
  "inbox",
  "read_next",
  "reading",
  "completed",
  "reference",
  "archived"
] as const;

export const SOURCE_TYPES = ["manual", "reddit", "linkedin"] as const;

export type ItemStatus = (typeof STATUSES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];

export type SavedItemRow = {
  id: string;
  user_id: string;
  title: string | null;
  canonical_url: string;
  original_url: string;
  url_hash: string;
  source_type: SourceType;
  source_external_id: string | null;
  source_payload: Record<string, unknown> | null;
  source_domain: string | null;
  author_name: string | null;
  excerpt: string | null;
  note: string | null;
  tags: string[] | null;
  ai_summary: string | null;
  ai_summary_status: "idle" | "pending" | "complete" | "failed";
  status: ItemStatus;
  saved_at: string | null;
  published_at: string | null;
  queued_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SavedItemInsert = {
  user_id: string;
  title?: string | null;
  canonical_url: string;
  original_url: string;
  url_hash: string;
  source_type: SourceType;
  source_external_id?: string | null;
  source_payload?: Record<string, unknown> | null;
  source_domain?: string | null;
  author_name?: string | null;
  excerpt?: string | null;
  note?: string | null;
  tags?: string[] | null;
  ai_summary?: string | null;
  ai_summary_status?: "idle" | "pending" | "complete" | "failed";
  status: ItemStatus;
  saved_at?: string | null;
  published_at?: string | null;
  queued_at?: string | null;
  archived_at?: string | null;
};

export type ItemListFilters = {
  q?: string;
  status?: ItemStatus;
  source?: SourceType;
  tag?: string;
};

export type ImportResult = {
  inserted: number;
  updated: number;
  duplicates: number;
};
