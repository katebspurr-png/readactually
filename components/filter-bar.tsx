import { SOURCE_TYPES, STATUSES } from "@/lib/types";

export function FilterBar({
  defaults
}: {
  defaults: { q?: string; source?: string; tag?: string; status?: string };
}) {
  return (
    <form className="toolbar" method="get">
      <div className="field">
        <label htmlFor="q">Search</label>
        <input defaultValue={defaults.q} id="q" name="q" placeholder="title, note, url..." />
      </div>

      <div className="field">
        <label htmlFor="source">Source</label>
        <select defaultValue={defaults.source ?? ""} id="source" name="source">
          <option value="">All sources</option>
          {SOURCE_TYPES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tag">Tag</label>
        <input defaultValue={defaults.tag} id="tag" name="tag" placeholder="career, design..." />
      </div>

      <div className="field">
        <label htmlFor="status">Status</label>
        <select defaultValue={defaults.status ?? ""} id="status" name="status">
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <button className="button-secondary" type="submit">
        Apply filters
      </button>
    </form>
  );
}
