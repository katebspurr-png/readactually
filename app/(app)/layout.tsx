import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/queries";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <AppShell userEmail={user.email ?? "Signed in"}>
      {children}
    </AppShell>
  );
}
