import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOpenAIClient } from "@/lib/openai";
import { buildSavedItemInsert, type NormalizedImportItem } from "@/lib/items";
import { SOURCE_TYPES, type SourceType } from "@/lib/types";
import { canonicalizeUrl, getDomain, hashUrl } from "@/lib/utils";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  // Verify Bearer token
  const authHeader = request.headers.get("Authorization");
  const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!jwt) {
    return NextResponse.json(
      { error: "Missing Authorization header" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const admin = createAdminClient();
  const { data: userData, error: authError } = await admin.auth.getUser(jwt);

  if (authError || !userData.user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const user = userData.user;

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { url, title, excerpt, body_text, source_type, og_image } = body as {
    url?: string;
    title?: string;
    excerpt?: string;
    body_text?: string;
    source_type?: string;
    og_image?: string;
  };

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "url is required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Coerce source_type to a valid enum value
  const resolvedSource: SourceType =
    SOURCE_TYPES.includes(source_type as SourceType) ? (source_type as SourceType) : "manual";

  // Canonicalize + dedup
  const canonicalUrl = canonicalizeUrl(url);
  const urlHash = hashUrl(canonicalUrl);

  // RLS-respecting client using the user's JWT
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );

  const { data: existing } = await userClient
    .from("saved_items")
    .select("*")
    .eq("url_hash", urlHash)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { status: "duplicate", item: existing },
      { status: 200, headers: CORS_HEADERS }
    );
  }

  // Generate tags + excerpt via OpenAI
  let aiTags: string[] = [];
  let aiExcerpt: string | null = excerpt ?? null;

  try {
    const openai = getOpenAIClient();
    const textSnippet = (body_text ?? "").slice(0, 500);
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            'You analyze web page metadata. Respond with raw JSON only — no markdown fences. Format: {"tags":["tag1","tag2"],"excerpt":"one sentence summary"}'
        },
        {
          role: "user",
          content: `Title: ${title ?? "Unknown"}\nURL: ${canonicalUrl}\nExcerpt: ${excerpt ?? "None"}\nBody: ${textSnippet}`
        }
      ]
    });

    const parsed = JSON.parse(response.output_text);
    if (Array.isArray(parsed.tags)) {
      aiTags = parsed.tags.slice(0, 5).map(String);
    }
    if (!aiExcerpt && typeof parsed.excerpt === "string") {
      aiExcerpt = parsed.excerpt;
    }
  } catch {
    // Fall back to empty tags and original excerpt
  }

  // Build and insert the item
  const normalizedItem: NormalizedImportItem = {
    title: title ?? null,
    originalUrl: url,
    canonicalUrl,
    urlHash,
    sourceType: resolvedSource,
    sourceDomain: getDomain(canonicalUrl),
    excerpt: aiExcerpt,
    tags: aiTags,
    status: "inbox",
    savedAt: new Date().toISOString(),
    sourcePayload: og_image ? { og_image } : null
  };

  const insert = buildSavedItemInsert(user.id, normalizedItem);

  const { data: inserted, error: insertError } = await userClient
    .from("saved_items")
    .insert(insert)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { status: "saved", item: inserted },
    { status: 201, headers: CORS_HEADERS }
  );
}
