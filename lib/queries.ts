import { cache } from "react";
import type { ItemListFilters, SavedItemRow } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user }
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
    query = query.or(
      `title.ilike.%${filters.q}%,excerpt.ilike.%${filters.q}%,note.ilike.%${filters.q}%,canonical_url.ilike.%${filters.q}%`
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
  const items = await getSavedItems();

  return {
    total: items.length,
    inbox: items.filter((item) => item.status === "inbox").length,
    readNext: items.filter((item) => item.status === "read_next").length,
    archived: items.filter((item) => item.status === "archived").length
  };
});
