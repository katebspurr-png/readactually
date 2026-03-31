import { notFound } from "next/navigation";
import { generateItemSummary, updateItemDetails, updateItemStatus } from "@/app/actions";
import { StatusBadge } from "@/components/status-badge";
import { STATUSES } from "@/lib/types";
import { getSavedItem } from "@/lib/queries";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getSavedItem(id);

  if (!item) {
    notFound();
  }

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
          <p>{item.excerpt || "No excerpt captured yet."}</p>
        </div>
        <div className="toolbar">
          <a className="button" href={item.original_url} target="_blank" rel="noreferrer">
            Open original
          </a>
          <form action={updateItemStatus} className="inline-form">
            <input name="item_id" type="hidden" value={item.id} />
            <div className="field">
              <label htmlFor="status">Move to</label>
              <select defaultValue={item.status} id="status" name="status">
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <button className="button-secondary" type="submit">
              Update status
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
              <input defaultValue={(item.tags ?? []).join(", ")} id="tags" name="tags" />
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
          <div>
            <h2>AI summary</h2>
            <p>
              This is intentionally lightweight in V1: short bullets to help you decide whether the item belongs in
              read_next or archive.
            </p>
          </div>

          {item.ai_summary ? (
            <div className="item-card">
              <p style={{ whiteSpace: "pre-wrap" }}>{item.ai_summary}</p>
            </div>
          ) : null}
          <p className="muted">Status: {item.ai_summary_status}</p>
          <form action={generateItemSummary}>
            <input name="item_id" type="hidden" value={item.id} />
            <button className="button-secondary" type="submit">
              Generate summary
            </button>
          </form>
        </section>
      </div>

      <section className="panel stack">
        <div>
          <h2>Source details</h2>
          <p>Keep only enough provenance to explain where the item came from and to support future debugging.</p>
        </div>
        <div className="stack">
          <p>
            <strong>Canonical URL:</strong> {item.canonical_url}
          </p>
          <p>
            <strong>Original URL:</strong> {item.original_url}
          </p>
          <p>
            <strong>Source author:</strong> {item.author_name || "Unknown"}
          </p>
          <p>
            <strong>Saved at:</strong> {item.saved_at ? new Date(item.saved_at).toLocaleString() : "Unknown"}
          </p>
        </div>
      </section>
    </div>
  );
}
