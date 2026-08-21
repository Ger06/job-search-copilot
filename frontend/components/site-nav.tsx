"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/import", label: "Importar CV" },
  { href: "/applications", label: "Postulaciones" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <span className="font-heading text-lg">Job Search Copilot</span>
        <nav className="flex gap-6 text-sm font-medium">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "border-b-2 border-primary text-primary"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
