import { importLinkedIn, importReddit } from "@/app/actions";
import { getImportUploads } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export default async function ImportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const uploads = await getImportUploads();

  return (
    <div className="stack">
      <section className="hero">
        <p className="muted">Imports</p>
        <h2>Bring in your saved content.</h2>
        <p className="muted">
          Upload Reddit JSON exports or LinkedIn CSV exports. Items land in your
          inbox and duplicates are merged automatically.
        </p>
      </section>

      {params.error ? (
        <section className="panel">
          <p className="error-msg">{params.error}</p>
        </section>
      ) : null}

      <div className="grid two">
        <section className="panel">
          <h2>Reddit import</h2>
          {params.source === "reddit" ? (
            <p className="success-msg">
              Reddit import complete: {params.inserted ?? 0} added,{" "}
              {params.updated ?? 0} updated, {params.duplicates ?? 0}{" "}
              duplicates.
            </p>
          ) : null}
          <p className="muted">
            Upload a JSON export of your saved items.
          </p>
          <form action={importReddit} className="stack">
            <div className="field">
              <label htmlFor="reddit_file">Reddit JSON file</label>
              <input
                accept=".json,application/json"
                id="reddit_file"
                name="reddit_file"
                required
                type="file"
              />
            </div>
            <button className="button" type="submit">
              Import Reddit
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>LinkedIn upload</h2>
          {params.source === "linkedin" ? (
            <p className="success-msg">
              LinkedIn import complete: {params.inserted ?? 0} added,{" "}
              {params.updated ?? 0} updated, {params.duplicates ?? 0}{" "}
              duplicates.
            </p>
          ) : null}
          <p className="muted">
            Upload a CSV export with a URL column.
          </p>
          <form action={importLinkedIn} className="stack">
            <div className="field">
              <label htmlFor="linkedin_file">LinkedIn CSV file</label>
              <input
                accept=".csv,text/csv"
                id="linkedin_file"
                name="linkedin_file"
                required
                type="file"
              />
            </div>
            <button className="button" type="submit">
              Import LinkedIn
            </button>
          </form>
        </section>
      </div>

      <section className="panel stack">
        <h2>Import history</h2>

        {!uploads.length ? (
          <div className="empty">No imports yet.</div>
        ) : (
          <div className="item-list">
            {uploads.map((upload: Record<string, unknown>) => (
              <article className="item-card" key={upload.id as string}>
                <div className="status-row">
                  <span className="status-badge">
                    {upload.source_type as string}
                  </span>
                  <span>{formatDate(upload.created_at as string)}</span>
                </div>
                <h3>{upload.filename as string}</h3>
                <p className="muted">
                  {upload.item_count as number} parsed, {upload.imported_count as number}{" "}
                  imported, {upload.duplicate_count as number} duplicates
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
