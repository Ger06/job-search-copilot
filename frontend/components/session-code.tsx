"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getOrCreateSessionId } from "@/lib/session";

export function truncateSessionId(sessionId: string): string {
  if (sessionId.length <= 13) return sessionId;
  return `${sessionId.slice(0, 8)}…${sessionId.slice(-4)}`;
}

export function useSessionId(): string | null {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Recién hay localStorage en el cliente, después del montaje — leer acá
    // evita un mismatch de hidratación contra el render del servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionId(getOrCreateSessionId());
  }, []);

  return sessionId;
}

export function CopySessionCodeButton({
  sessionId,
  className,
  size = "sm",
}: {
  sessionId: string;
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size={size} onClick={handleCopy} className={className}>
      {copied ? "Copiado" : "Copiar código"}
    </Button>
  );
}
