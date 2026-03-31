import Link from "next/link";
import { updateItemStatus } from "@/app/actions";
import type { SavedItemRow } from "@/lib/types";
import { formatDate, truncate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export function ItemCard({ item }: { item: SavedItemRow }) {
  return (
    <article className="item-card stack">
      <div className="status-row">
        <StatusBadge status={item.status} />
        <span>{item.source_type}</span>
        {item.source_domain ? <span>{item.source_domain}</span> : null}
      </div>

      <div>
        <h3>{item.title || item.canonical_url}</h3>
        <p className="muted">
          {truncate(item.excerpt || item.note || item.canonical_url)}
        </p>
      </div>

      <div className="item-meta">
        {item.author_name ? <span>By {item.author_name}</span> : null}
        {item.saved_at ? <span>Saved {formatDate(item.saved_at)}</span> : null}
      </div>

      {item.tags?.length ? (
        <div className="tag-row">
          {item.tags.map((tag) => (
            <Link
              className="tag"
              href={`/inbox?tag=${encodeURIComponent(tag)}`}
              key={tag}
            >
              {tag}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="toolbar">
        <Link className="button-secondary" href={`/items/${item.id}`}>
          Open
        </Link>
        <a
          className="button-secondary"
          href={item.original_url}
          target="_blank"
          rel="noreferrer"
        >
          Read
        </a>
        {item.status !== "read_next" ? (
          <form action={updateItemStatus}>
            <input name="item_id" type="hidden" value={item.id} />
            <input name="status" type="hidden" value="read_next" />
            <button className="button-secondary" type="submit">
              Queue
            </button>
          </form>
        ) : null}
        {item.status !== "archived" ? (
          <form action={updateItemStatus}>
            <input name="item_id" type="hidden" value={item.id} />
            <input name="status" type="hidden" value="archived" />
            <button className="button-secondary" type="submit">
              Archive
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}
