"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNav() {
  const pathname = usePathname();
  const navItems = [
    { href: "/inbox", label: "Inbox" },
    { href: "/queue", label: "Read Next" },
    { href: "/archive", label: "Archive" },
    { href: "/imports", label: "Imports" }
  ];

  return (
    <>
      {navItems.map((item) => (
        <Link className={pathname.startsWith(item.href) ? "active" : undefined} href={item.href} key={item.href}>
          {item.label}
        </Link>
      ))}
    </>
  );
}
