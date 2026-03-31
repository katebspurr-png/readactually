import Link from "next/link";
import { signIn, signUp } from "./actions";

export default async function AuthPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === "signup" ? "signup" : "signin";

  return (
    <main className="content">
      <div className="grid two">
        <section className="hero">
          <p className="muted">Saved Content Inbox</p>
          <h2>Keep the capture flow simple. Make the reading flow irresistible.</h2>
          <p>
            V1 focuses on imports, triage, and reading. No recommendation engine. No social layer. Just a
            useful personal inbox for saved content.
          </p>
          <p className="muted">
            Sources in scope: Reddit saved exports, LinkedIn export uploads, and manual URLs.
          </p>
        </section>

        <section className="panel">
          <h2>{mode === "signup" ? "Create account" : "Sign in"}</h2>
          {params.error ? <p style={{ color: "var(--danger)" }}>{params.error}</p> : null}
          {params.message ? <p style={{ color: "var(--success)" }}>{params.message}</p> : null}
          <form action={mode === "signup" ? signUp : signIn} className="stack">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" minLength={8} required />
            </div>
            <button className="button" type="submit">
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="muted">
            {mode === "signup" ? "Already have an account?" : "Need an account?"}{" "}
            <Link href={mode === "signup" ? "/auth" : "/auth?mode=signup"}>
              {mode === "signup" ? "Sign in" : "Create one"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
