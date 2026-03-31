import { FilterBar } from "@/components/filter-bar";
import { ItemList } from "@/components/item-list";
import { saveManualUrl } from "@/app/actions";
import { getDashboardStats, getSavedItems } from "@/lib/queries";
import type { ItemListFilters } from "@/lib/types";
import { isValidSource, isValidStatus } from "@/lib/types";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const filters: ItemListFilters = {
    q: params.q,
    status: isValidStatus(params.status ?? "") ? params.status as ItemListFilters["status"] : undefined,
    source: isValidSource(params.source ?? "") ? params.source as ItemListFilters["source"] : undefined,
    tag: params.tag,
  };

  const [items, stats] = await Promise.all([
    getSavedItems(filters),
    getDashboardStats(),
  ]);

  return (
    <div className="stack">
      <section className="hero stack">
        <div>
          <p className="muted">Inbox</p>
          <h2>Capture first, triage with intent.</h2>
        </div>
        <div className="stats">
          <div className="stat">
            <strong>{stats.total}</strong>
            <span>Total</span>
          </div>
          <div className="stat">
            <strong>{stats.inbox}</strong>
            <span>Inbox</span>
          </div>
          <div className="stat">
            <strong>{stats.readNext}</strong>
            <span>Read next</span>
          </div>
          <div className="stat">
            <strong>{stats.archived}</strong>
            <span>Archived</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Save a URL</h2>
        {params.saved ? (
          <p className="success-msg">Saved to your inbox.</p>
        ) : null}
        {params.error ? <p className="error-msg">{params.error}</p> : null}
        <form action={saveManualUrl} className="toolbar">
          <div className="field" style={{ flex: 2 }}>
            <label htmlFor="url">URL</label>
            <input
              id="url"
              name="url"
              placeholder="https://example.com/article"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="title">Title (optional)</label>
            <input id="title" name="title" placeholder="Override page title" />
          </div>
          <div className="field">
            <label htmlFor="tags">Tags</label>
            <input id="tags" name="tags" placeholder="career, ai, design" />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select defaultValue="inbox" id="status" name="status">
              <option value="inbox">inbox</option>
              <option value="read_next">read next</option>
              <option value="reference">reference</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="note">Note</label>
            <input id="note" name="note" placeholder="Why save this?" />
          </div>
          <button className="button" type="submit">
            Save
          </button>
        </form>
      </section>

      <section className="panel stack">
        <h2>Filter</h2>
        <FilterBar defaults={params} />
      </section>

      <section className="stack">
        <ItemList
          items={items}
          emptyMessage="No items match the current filters."
        />
      </section>
    </div>
  );
}
