import { z } from "zod";
import type {
  ItemStatus,
  SavedItemInsert,
  SavedItemRow,
  SourceType,
} from "@/lib/types";
import { canonicalizeUrl, getDomain, hashUrl, parseTags } from "@/lib/utils";

const manualItemSchema = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
  note: z.string().optional(),
  tags: z.string().optional(),
  status: z
    .enum(["inbox", "read_next", "reading", "completed", "reference", "archived"])
    .default("inbox"),
});

export type NormalizedImportItem = {
  title?: string | null;
  originalUrl: string;
  canonicalUrl: string;
  urlHash: string;
  sourceType: SourceType;
  sourceExternalId?: string | null;
  sourcePayload?: Record<string, unknown> | null;
  sourceDomain?: string | null;
  authorName?: string | null;
  excerpt?: string | null;
  note?: string | null;
  tags?: string[];
  status: ItemStatus;
  savedAt?: string | null;
  publishedAt?: string | null;
};

export function validateManualSubmission(
  raw: Record<string, FormDataEntryValue>
) {
  return manualItemSchema.parse({
    url: raw.url,
    title: raw.title,
    note: raw.note,
    tags: raw.tags,
    status: raw.status,
  });
}

export async function fetchPageMetadata(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: { "User-Agent": "ReadActually/1.0" },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    clearTimeout(timeout);
    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const descMatch =
      html.match(
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
      ) ??
      html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
      );

    return {
      title: titleMatch?.[1]?.trim() || null,
      excerpt: descMatch?.[1]?.trim() || null,
    };
  } catch {
    return { title: null, excerpt: null };
  }
}

export async function normalizeManualUrl(
  raw: Record<string, FormDataEntryValue>
): Promise<NormalizedImportItem> {
  const parsed = validateManualSubmission(raw);
  const canonicalUrl = canonicalizeUrl(parsed.url);
  const metadata = await fetchPageMetadata(canonicalUrl);

  return {
    title: parsed.title || metadata.title,
    originalUrl: parsed.url,
    canonicalUrl,
    urlHash: hashUrl(canonicalUrl),
    sourceType: "manual",
    sourceDomain: getDomain(canonicalUrl),
    excerpt: metadata.excerpt,
    note: parsed.note || null,
    tags: parsed.tags ? parseTags(parsed.tags) : [],
    status: parsed.status,
  };
}

export function parseRedditImport(content: string): NormalizedImportItem[] {
  const payload = JSON.parse(content);
  const items: unknown[] = Array.isArray(payload)
    ? payload
    : (payload.children ?? payload.data ?? []);

  return items
    .map((entry) => {
      const obj = entry as Record<string, unknown>;
      const value =
        "data" in obj ? (obj.data as Record<string, unknown>) : obj;

      const permalink = String(value.permalink ?? "");
      const outboundUrl = String(
        value.url_overridden_by_dest ?? value.url ?? ""
      );
      const rawUrl =
        outboundUrl ||
        (permalink ? `https://www.reddit.com${permalink}` : "");

      if (!rawUrl) return null;

      const canonicalUrl = canonicalizeUrl(rawUrl);

      return {
        title: String(value.title ?? value.link_title ?? ""),
        originalUrl: rawUrl,
        canonicalUrl,
        urlHash: hashUrl(canonicalUrl),
        sourceType: "reddit" as const,
        sourceExternalId: String(value.name ?? value.id ?? ""),
        sourcePayload: value,
        sourceDomain: getDomain(canonicalUrl),
        authorName: String(value.author ?? ""),
        excerpt: String(value.selftext ?? value.body ?? ""),
        status: "inbox" as const,
        savedAt: value.created_utc
          ? new Date(Number(value.created_utc) * 1000).toISOString()
          : null,
      } satisfies NormalizedImportItem;
    })
    .filter(Boolean) as NormalizedImportItem[];
}

export function parseLinkedInExport(content: string): NormalizedImportItem[] {
  const rows = parseCsv(content);

  return rows
    .map((row) => {
      const originalUrl = row.URL || row.Link || row.Url || row.url;
      if (!originalUrl) return null;

      const canonicalUrl = canonicalizeUrl(originalUrl);
      return {
        title: row.Title || row.Name || null,
        originalUrl,
        canonicalUrl,
        urlHash: hashUrl(canonicalUrl),
        sourceType: "linkedin" as const,
        sourcePayload: row,
        sourceDomain: getDomain(canonicalUrl),
        authorName: row.Author || row.Publisher || null,
        excerpt: row.Description || row.Notes || null,
        status: "inbox" as const,
        savedAt: row["Saved Date"]
          ? new Date(row["Saved Date"]).toISOString()
          : null,
      } satisfies NormalizedImportItem;
    })
    .filter(Boolean) as NormalizedImportItem[];
}

function parseCsv(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let insideQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const [headerRow, ...dataRows] = rows;
  if (!headerRow) return [];

  return dataRows.map((dataRow) =>
    headerRow.reduce<Record<string, string>>((acc, key, index) => {
      acc[key.trim()] = (dataRow[index] ?? "").trim();
      return acc;
    }, {})
  );
}

export function buildSavedItemInsert(
  userId: string,
  item: NormalizedImportItem
): SavedItemInsert {
  return {
    user_id: userId,
    title: item.title ?? null,
    original_url: item.originalUrl,
    canonical_url: item.canonicalUrl,
    url_hash: item.urlHash,
    source_type: item.sourceType,
    source_external_id: item.sourceExternalId ?? null,
    source_payload: item.sourcePayload ?? null,
    source_domain: item.sourceDomain ?? null,
    author_name: item.authorName ?? null,
    excerpt: item.excerpt ?? null,
    note: item.note ?? null,
    tags: item.tags ?? [],
    ai_summary_status: "idle",
    status: item.status,
    saved_at: item.savedAt ?? new Date().toISOString(),
    published_at: item.publishedAt ?? null,
    queued_at: item.status === "read_next" ? new Date().toISOString() : null,
    archived_at: item.status === "archived" ? new Date().toISOString() : null,
  };
}

export function mergeExistingItem(
  existing: SavedItemRow,
  incoming: SavedItemInsert
) {
  const mergedTags = Array.from(
    new Set([...(existing.tags ?? []), ...(incoming.tags ?? [])])
  );

  return {
    title: incoming.title || existing.title,
    excerpt: incoming.excerpt || existing.excerpt,
    note: incoming.note || existing.note,
    author_name: incoming.author_name || existing.author_name,
    source_domain: incoming.source_domain || existing.source_domain,
    tags: mergedTags,
    // If existing was archived and incoming isn't, re-surface it
    status:
      existing.status === "archived" && incoming.status !== "archived"
        ? incoming.status
        : existing.status,
  };
}
