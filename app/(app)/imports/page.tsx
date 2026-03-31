import { importLinkedIn, importReddit } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries";

export default async function ImportsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; source?: string; inserted?: string; updated?: string; duplicates?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: uploads } = await supabase
    .from("import_uploads")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="stack">
      <section className="hero">
        <p className="muted">Imports</p>
        <h2>Hybrid ingestion, not platform sprawl.</h2>
        <p>V1 supports the minimum practical set: Reddit exports, LinkedIn exports, and manual capture.</p>
      </section>

      <div className="grid two">
        <section className="panel">
          <h2>Reddit import</h2>
          {params.source === "reddit" ? (
            <p style={{ color: "var(--success)" }}>
              Reddit import complete. Inserted {params.inserted ?? 0}, updated {params.updated ?? 0}, duplicates{" "}
              {params.duplicates ?? 0}.
            </p>
          ) : null}
          <p>Upload a JSON export of saved items. The importer extracts URLs and merges duplicates automatically.</p>
          <form action={importReddit} className="stack">
            <div className="field">
              <label htmlFor="reddit_file">Reddit JSON export</label>
              <input accept=".json,application/json" id="reddit_file" name="reddit_file" required type="file" />
            </div>
            <button className="button" type="submit">
              Import Reddit
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>LinkedIn upload</h2>
          {params.source === "linkedin" ? (
            <p style={{ color: "var(--success)" }}>
              LinkedIn import complete. Inserted {params.inserted ?? 0}, updated {params.updated ?? 0}, duplicates{" "}
              {params.duplicates ?? 0}.
            </p>
          ) : null}
          <p>Upload a CSV export with a URL column. The importer keeps the raw row payload for light provenance.</p>
          <form action={importLinkedIn} className="stack">
            <div className="field">
              <label htmlFor="linkedin_file">LinkedIn CSV export</label>
              <input accept=".csv,text/csv" id="linkedin_file" name="linkedin_file" required type="file" />
            </div>
            <button className="button" type="submit">
              Import LinkedIn
            </button>
          </form>
        </section>
      </div>

      {params.error ? (
        <section className="panel">
          <p style={{ color: "var(--danger)" }}>{params.error}</p>
        </section>
      ) : null}

      <section className="panel stack">
        <div>
          <h2>Recent uploads</h2>
          <p>A light audit trail is enough for V1. We only store source, filename, counts, and timestamp.</p>
        </div>

        {!uploads?.length ? (
          <div className="empty">No imports yet.</div>
        ) : (
          <div className="item-list">
            {uploads.map((upload) => (
              <article className="item-card" key={upload.id}>
                <div className="status-row">
                  <span className="status-badge">{upload.source_type}</span>
                  <span>{new Date(upload.created_at).toLocaleString()}</span>
                </div>
                <h3>{upload.filename}</h3>
                <p className="muted">
                  Parsed {upload.item_count} rows, added or updated {upload.imported_count}, duplicates seen:{" "}
                  {upload.duplicate_count}.
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
