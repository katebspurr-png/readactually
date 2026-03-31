import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saved Content Inbox",
  description: "Import saved content, triage it, and actually read it later."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
