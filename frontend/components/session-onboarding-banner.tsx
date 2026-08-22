"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const DISMISSED_STORAGE_KEY = "job-search-copilot:onboarding-banner-dismissed";

export const SESSION_ONBOARDING_TITLE = "Tus datos están ligados a un código de sesión";

export function SessionOnboardingDescription() {
  return (
    <AlertDescription>
      No hay usuario ni contraseña: tus datos quedan asociados a un código único, visible en la barra de
      navegación. Si cambiás de dispositivo o navegador, copiá ese código y pegalo en{" "}
      <Link href="/session">/session</Link> para recuperarlos — sin ese código no hay forma de recuperarlos.
    </AlertDescription>
  );
}

export function SessionOnboardingBanner() {
  // Arranca oculto hasta confirmar en el cliente si ya se cerró antes —
  // evita un flash del banner en el primer render (el server no tiene
  // localStorage), mismo criterio que useSessionId en session-code.tsx.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(globalThis.localStorage.getItem(DISMISSED_STORAGE_KEY) === "true");
  }, []);

  function handleDismiss() {
    globalThis.localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-4">
      <Alert>
        <AlertTitle>{SESSION_ONBOARDING_TITLE}</AlertTitle>
        <SessionOnboardingDescription />
        <AlertAction>
          <Button type="button" variant="ghost" size="icon-sm" onClick={handleDismiss} aria-label="Cerrar aviso">
            <X />
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}
