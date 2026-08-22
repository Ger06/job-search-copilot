"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { CopySessionCodeButton, truncateSessionId, useSessionId } from "@/components/session-code";

const NAV_LINKS = [
  { href: "/import", label: "Importar CV" },
  { href: "/applications", label: "Postulaciones" },
];

export function SiteNav() {
  const pathname = usePathname();
  const sessionId = useSessionId();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <span className="font-heading text-lg">Job Search Copilot</span>
        <nav className="flex items-center gap-6 text-sm font-medium">
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
        {sessionId && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{truncateSessionId(sessionId)}</span>
            <CopySessionCodeButton sessionId={sessionId} />
            <Link href="/session" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Sesión
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
