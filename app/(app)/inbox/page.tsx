import { FilterBar } from "@/components/filter-bar";
import { ItemList } from "@/components/item-list";
import { saveManualUrl } from "@/app/actions";
import { getDashboardStats, getSavedItems } from "@/lib/queries";

export default async function InboxPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; source?: string; tag?: string; status?: string; saved?: string }>;
}) {
  const filters = await searchParams;
  const [items, stats] = await Promise.all([getSavedItems(filters), getDashboardStats()]);

  return (
    <div className="stack">
      <section className="hero stack">
        <div>
          <p className="muted">Inbox</p>
          <h2>Capture first, then triage with intent.</h2>
          <p>
            Manual saves land here by default, and imports feed the same normalized queue so reading decisions stay
            in one place.
          </p>
        </div>
        <div className="stats">
          <div className="stat">
            <strong>{stats.total}</strong>
            <span>Total items</span>
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
        {filters.saved ? <p style={{ color: "var(--success)" }}>Saved to your inbox.</p> : null}
        <form action={saveManualUrl} className="toolbar">
          <div className="field" style={{ flex: 2 }}>
            <label htmlFor="url">URL</label>
            <input id="url" name="url" placeholder="https://example.com/article" required />
          </div>
          <div className="field">
            <label htmlFor="title">Optional title</label>
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
              <option value="read_next">read_next</option>
              <option value="reference">reference</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="note">Quick note</label>
            <input id="note" name="note" placeholder="why save this?" />
          </div>
          <button className="button" type="submit">
            Save item
          </button>
        </form>
      </section>

      <section className="panel stack">
        <div>
          <h2>Search and filter</h2>
          <p>Keep triage fast by narrowing the inbox to source, tag, status, or free text.</p>
        </div>
        <FilterBar defaults={filters} />
      </section>

      <section className="stack">
        <ItemList items={items} emptyMessage="No items match the current inbox filters." />
      </section>
    </div>
  );
}
