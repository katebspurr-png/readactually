import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/inbox");
  }

  return (
    <main className="content">
      <div className="hero stack">
        <div>
          <p className="muted">Saved Content Inbox</p>
          <h2>Turn scattered saved links into a reading workflow you will actually use.</h2>
          <p>
            Import Reddit saves, upload LinkedIn exports, add manual URLs, then sort everything into
            inbox, read next, and archive with notes, tags, and quick AI summaries.
          </p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/auth">
            Sign in
          </Link>
          <Link className="button-secondary" href="/auth?mode=signup">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
