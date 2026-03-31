import Link from "next/link";
import { notFound } from "next/navigation";
import {
  generateItemSummary,
  updateItemDetails,
  updateItemStatus,
} from "@/app/actions";
import { StatusBadge } from "@/components/status-badge";
import { STATUSES } from "@/lib/types";
import { getSavedItem } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getSavedItem(id);

  if (!item) notFound();

  return (
    <div className="stack">
      <section className="hero stack">
        <div className="status-row">
          <StatusBadge status={item.status} />
          <span>{item.source_type}</span>
          {item.source_domain ? <span>{item.source_domain}</span> : null}
        </div>
        <div>
          <h2>{item.title || item.canonical_url}</h2>
          {item.excerpt ? (
            <p className="muted">{item.excerpt}</p>
          ) : null}
        </div>
        <div className="toolbar">
          <a
            className="button"
            href={item.original_url}
            target="_blank"
            rel="noreferrer"
          >
            Open original
          </a>
          <Link className="button-secondary" href="/inbox">
            Back to inbox
          </Link>
          <form action={updateItemStatus} className="inline-form">
            <input name="item_id" type="hidden" value={item.id} />
            <div className="field">
              <label htmlFor="status">Move to</label>
              <select defaultValue={item.status} id="status" name="status">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <button className="button-secondary" type="submit">
              Update
            </button>
          </form>
        </div>
      </section>

      <div className="grid two">
        <section className="panel">
          <h2>Edit details</h2>
          <form action={updateItemDetails} className="stack">
            <input name="item_id" type="hidden" value={item.id} />
            <div className="field">
              <label htmlFor="title">Title</label>
              <input defaultValue={item.title ?? ""} id="title" name="title" />
            </div>
            <div className="field">
              <label htmlFor="tags">Tags</label>
              <input
                defaultValue={(item.tags ?? []).join(", ")}
                id="tags"
                name="tags"
                placeholder="comma-separated"
              />
            </div>
            <div className="field">
              <label htmlFor="note">Notes</label>
              <textarea defaultValue={item.note ?? ""} id="note" name="note" />
            </div>
            <button className="button" type="submit">
              Save changes
            </button>
          </form>
        </section>

        <section className="panel stack">
          <h2>AI summary</h2>
          {item.ai_summary ? (
            <div className="summary-content">
              <p style={{ whiteSpace: "pre-wrap" }}>{item.ai_summary}</p>
            </div>
          ) : (
            <p className="muted">
              {item.ai_summary_status === "pending"
                ? "Generating summary..."
                : item.ai_summary_status === "failed"
                  ? "Summary generation failed. Try again."
                  : "No summary yet. Generate one to help with triage."}
            </p>
          )}
          <form action={generateItemSummary}>
            <input name="item_id" type="hidden" value={item.id} />
            <button className="button-secondary" type="submit">
              {item.ai_summary ? "Regenerate" : "Generate"} summary
            </button>
          </form>
        </section>
      </div>

      <section className="panel stack">
        <h2>Source details</h2>
        <dl className="detail-list">
          <dt>Canonical URL</dt>
          <dd>
            <a href={item.canonical_url} target="_blank" rel="noreferrer">
              {item.canonical_url}
            </a>
          </dd>
          <dt>Original URL</dt>
          <dd>{item.original_url}</dd>
          {item.author_name ? (
            <>
              <dt>Author</dt>
              <dd>{item.author_name}</dd>
            </>
          ) : null}
          <dt>Saved</dt>
          <dd>{formatDate(item.saved_at) ?? "Unknown"}</dd>
          {item.published_at ? (
            <>
              <dt>Published</dt>
              <dd>{formatDate(item.published_at)}</dd>
            </>
          ) : null}
        </dl>
      </section>
    </div>
  );
}
