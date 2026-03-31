"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="stack">
      <section className="hero">
        <h2>Something went wrong</h2>
        <p className="muted">{error.message || "An unexpected error occurred."}</p>
        <button className="button" onClick={reset}>
          Try again
        </button>
      </section>
    </div>
  );
}
