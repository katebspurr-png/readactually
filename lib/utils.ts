import { createHash } from "node:crypto";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function absoluteUrl(input: string) {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }
  return `https://${input}`;
}

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
]);

export function canonicalizeUrl(input: string) {
  const url = new URL(absoluteUrl(input));
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  const nextParams = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) {
      nextParams.append(key, value);
    }
  }
  url.search = nextParams.toString();

  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

export function hashUrl(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function getDomain(input: string) {
  try {
    return new URL(input).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function parseTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function formatStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function truncate(text: string | null | undefined, length = 160) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

/** Escape special characters in a string used within an ilike pattern. */
export function escapeIlike(input: string) {
  return input.replace(/[%_\\]/g, (char) => `\\${char}`);
}

export function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
