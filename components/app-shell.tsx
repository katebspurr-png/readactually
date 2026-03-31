import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { SidebarNav } from "@/components/sidebar-nav";

export function AppShell({
  children,
  userEmail
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Saved Content Inbox</h1>
          <p>{userEmail}</p>
        </div>

        <nav className="nav">
          <SidebarNav />
          <form action={signOut}>
            <button type="submit">Sign out</button>
          </form>
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
