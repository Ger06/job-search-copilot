"use client";

import { useState } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopySessionCodeButton, useSessionId } from "@/components/session-code";
import { SESSION_ONBOARDING_TITLE, SessionOnboardingDescription } from "@/components/session-onboarding-banner";
import { setSessionId } from "@/lib/session";

export default function SessionPage() {
  const sessionId = useSessionId();
  const [restoreValue, setRestoreValue] = useState("");

  function handleRestore() {
    if (restoreValue.trim().length === 0) return;
    setSessionId(restoreValue);
    // Reload duro a propósito (no router.push): no hay un store global que
    // se refresque solo con el nuevo sessionId, así que evitamos auditar
    // qué componente quedó con datos de la sesión anterior en memoria.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/applications";
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      <Alert>
        <AlertTitle>{SESSION_ONBOARDING_TITLE}</AlertTitle>
        <SessionOnboardingDescription />
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Tu sesión</CardTitle>
          <CardDescription>
            Este código identifica tus datos en este navegador. No es una contraseña: cualquiera que lo tenga puede
            acceder a la misma información. Copialo para usarlo en otro dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {sessionId && (
            <>
              <p className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm break-all select-all">
                {sessionId}
              </p>
              <CopySessionCodeButton sessionId={sessionId} size="default" className="self-start" />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Restaurar sesión desde otro dispositivo</CardTitle>
          <CardDescription>
            Pegá acá el código de una sesión existente para ver sus datos en este navegador. Esto reemplaza la
            sesión actual de este navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="restore-code">Código de sesión</Label>
            <Input
              id="restore-code"
              value={restoreValue}
              onChange={(event) => setRestoreValue(event.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="font-mono"
            />
          </div>
          <Button
            type="button"
            disabled={restoreValue.trim().length === 0}
            onClick={handleRestore}
            className="self-end"
          >
            Usar este código
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
