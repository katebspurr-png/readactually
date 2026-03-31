import Link from "next/link";

export default function NotFound() {
  return (
    <div className="stack">
      <section className="hero">
        <h2>Not found</h2>
        <p className="muted">The page or item you're looking for doesn't exist.</p>
        <Link className="button" href="/inbox">
          Back to inbox
        </Link>
      </section>
    </div>
  );
}
