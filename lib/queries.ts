import { cache } from "react";
import type { ItemListFilters, ItemStatus, SavedItemRow } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { escapeIlike } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function getSavedItems(filters: ItemListFilters = {}) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  let query = supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.source) {
    query = query.eq("source_type", filters.source);
  }

  if (filters.tag) {
    query = query.contains("tags", [filters.tag]);
  }

  if (filters.q) {
    const escaped = escapeIlike(filters.q);
    query = query.or(
      `title.ilike.%${escaped}%,excerpt.ilike.%${escaped}%,note.ilike.%${escaped}%,canonical_url.ilike.%${escaped}%`
    );
  }

  const { data } = await query;
  return (data ?? []) as SavedItemRow[];
}

export const getSavedItem = cache(async (itemId: string) => {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data } = await supabase
    .from("saved_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  return data as SavedItemRow | null;
});

export const getDashboardStats = cache(async () => {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { total: 0, inbox: 0, readNext: 0, archived: 0 };

  const counts: Record<string, number> = {};
  let total = 0;

  // Use individual count queries per status to avoid fetching all rows
  await Promise.all(
    STATUSES.map(async (status) => {
      const { count } = await supabase
        .from("saved_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", status);
      counts[status] = count ?? 0;
      total += count ?? 0;
    })
  );

  return {
    total,
    inbox: counts.inbox ?? 0,
    readNext: counts.read_next ?? 0,
    reading: counts.reading ?? 0,
    completed: counts.completed ?? 0,
    reference: counts.reference ?? 0,
    archived: counts.archived ?? 0,
  };
});

export async function getImportUploads() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data } = await supabase
    .from("import_uploads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}
