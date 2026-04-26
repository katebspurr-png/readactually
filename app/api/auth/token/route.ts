import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { email, password } = body as Record<string, unknown>;

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "Authentication failed" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const { access_token, refresh_token, expires_at } = data.session;

  return NextResponse.json(
    { access_token, refresh_token, expires_at },
    { status: 200, headers: CORS_HEADERS }
  );
}
