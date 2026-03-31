"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOpenAIClient } from "@/lib/openai";
import { getCurrentUser } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import {
  buildSavedItemInsert,
  mergeExistingItem,
  normalizeManualUrl,
  parseLinkedInExport,
  parseRedditImport,
} from "@/lib/items";
import type { SavedItemInsert } from "@/lib/types";
import { isValidStatus, STATUSES } from "@/lib/types";
import { parseTags } from "@/lib/utils";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user;
}

function revalidateAll() {
  revalidatePath("/inbox");
  revalidatePath("/queue");
  revalidatePath("/archive");
}

async function upsertNormalizedItems(
  userId: string,
  items: SavedItemInsert[],
  sourceType: "manual" | "reddit" | "linkedin",
  filename?: string
) {
  const supabase = await createClient();
  let inserted = 0;
  let updated = 0;
  let duplicates = 0;

  for (const item of items) {
    const { data: existing } = await supabase
      .from("saved_items")
      .select("*")
      .eq("user_id", item.user_id)
      .eq("url_hash", item.url_hash)
      .maybeSingle();

    if (existing) {
      duplicates += 1;
      const merged = mergeExistingItem(existing, item);
      const { error } = await supabase
        .from("saved_items")
        .update(merged)
        .eq("id", existing.id);
      if (!error) updated += 1;
      continue;
    }

    const { error } = await supabase.from("saved_items").insert(item);
    if (!error) inserted += 1;
  }

  if (filename) {
    await supabase.from("import_uploads").insert({
      user_id: userId,
      source_type: sourceType,
      filename,
      item_count: items.length,
      imported_count: inserted + updated,
      duplicate_count: duplicates,
    });
  }

  return { inserted, updated, duplicates };
}

export async function saveManualUrl(formData: FormData) {
  const user = await requireUser();

  let normalized;
  try {
    normalized = await normalizeManualUrl(
      Object.fromEntries(formData.entries())
    );
  } catch {
    redirect("/inbox?error=Invalid+URL+or+missing+fields");
  }

  const payload = buildSavedItemInsert(user.id, normalized);
  await upsertNormalizedItems(user.id, [payload], "manual");
  revalidateAll();
  redirect("/inbox?saved=1");
}

export async function importReddit(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("reddit_file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/imports?error=Missing+or+empty+Reddit+file");
  }

  let items: SavedItemInsert[];
  try {
    const content = await file.text();
    items = parseRedditImport(content).map((item) =>
      buildSavedItemInsert(user.id, item)
    );
  } catch {
    redirect("/imports?error=Failed+to+parse+Reddit+JSON.+Check+the+file+format.");
  }

  if (items.length === 0) {
    redirect("/imports?error=No+items+found+in+the+Reddit+export");
  }

  const result = await upsertNormalizedItems(
    user.id,
    items,
    "reddit",
    file.name
  );
  revalidateAll();
  revalidatePath("/imports");
  redirect(
    `/imports?source=reddit&inserted=${result.inserted}&updated=${result.updated}&duplicates=${result.duplicates}`
  );
}

export async function importLinkedIn(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("linkedin_file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/imports?error=Missing+or+empty+LinkedIn+file");
  }

  let items: SavedItemInsert[];
  try {
    const content = await file.text();
    items = parseLinkedInExport(content).map((item) =>
      buildSavedItemInsert(user.id, item)
    );
  } catch {
    redirect(
      "/imports?error=Failed+to+parse+LinkedIn+CSV.+Check+the+file+format."
    );
  }

  if (items.length === 0) {
    redirect("/imports?error=No+items+found+in+the+LinkedIn+export");
  }

  const result = await upsertNormalizedItems(
    user.id,
    items,
    "linkedin",
    file.name
  );
  revalidateAll();
  revalidatePath("/imports");
  redirect(
    `/imports?source=linkedin&inserted=${result.inserted}&updated=${result.updated}&duplicates=${result.duplicates}`
  );
}

export async function updateItemStatus(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const itemId = String(formData.get("item_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!isValidStatus(status)) return;

  await supabase
    .from("saved_items")
    .update({
      status,
      queued_at: status === "read_next" ? new Date().toISOString() : undefined,
      archived_at: status === "archived" ? new Date().toISOString() : undefined,
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  revalidateAll();
  revalidatePath(`/items/${itemId}`);
}

export async function updateItemDetails(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const itemId = String(formData.get("item_id") ?? "");
  const title = String(formData.get("title") ?? "");
  const note = String(formData.get("note") ?? "");
  const tags = parseTags(String(formData.get("tags") ?? ""));

  await supabase
    .from("saved_items")
    .update({ title: title || null, note: note || null, tags })
    .eq("id", itemId)
    .eq("user_id", user.id);

  revalidatePath(`/items/${itemId}`);
  revalidateAll();
}

export async function generateItemSummary(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const itemId = String(formData.get("item_id") ?? "");

  const { data: item } = await supabase
    .from("saved_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (!item) return;

  await supabase
    .from("saved_items")
    .update({ ai_summary_status: "pending" })
    .eq("id", itemId);

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You summarize saved links for later reading. Return 2-3 short bullet points explaining why the item may be worth reading and what to expect. Be concise.",
        },
        {
          role: "user",
          content: `Title: ${item.title ?? "Unknown"}\nURL: ${item.canonical_url}\nExcerpt: ${item.excerpt ?? "None"}\nNotes: ${item.note ?? "None"}`,
        },
      ],
      max_tokens: 300,
    });

    const summary = response.choices[0]?.message?.content ?? null;

    await supabase
      .from("saved_items")
      .update({
        ai_summary: summary,
        ai_summary_status: summary ? "complete" : "failed",
      })
      .eq("id", itemId);
  } catch {
    await supabase
      .from("saved_items")
      .update({ ai_summary_status: "failed" })
      .eq("id", itemId);
  }

  revalidatePath(`/items/${itemId}`);
}
