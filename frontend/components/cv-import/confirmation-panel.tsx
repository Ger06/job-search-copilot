"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ConfirmCVResult } from "@/lib/cv-parse-result";

export function ConfirmationPanel({ result, onReset }: { result: ConfirmCVResult; onReset: () => void }) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div
          className="flex size-24 -rotate-6 items-center justify-center rounded-full border-4 border-stamp-teal text-stamp-teal"
          style={{ animation: "stamp-in 0.35s ease-out" }}
        >
          <span className="font-heading text-sm font-semibold tracking-wide uppercase">Guardado</span>
        </div>
        <h1 className="text-2xl">Borrador confirmado</h1>
        <p className="text-muted-foreground">
          Se crearon {result.workExperiences.length}{" "}
          {result.workExperiences.length === 1 ? "experiencia laboral" : "experiencias laborales"} y{" "}
          {result.bullets.length} {result.bullets.length === 1 ? "logro" : "logros"}.
        </p>
        <Button size="lg" onClick={onReset}>
          Importar otro CV
        </Button>
      </CardContent>
    </Card>
  );
}
