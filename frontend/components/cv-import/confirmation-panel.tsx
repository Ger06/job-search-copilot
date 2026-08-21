"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ConfirmCVResult } from "@/lib/cv-parse-result";

export function ConfirmationPanel({ result, onReset }: { result: ConfirmCVResult; onReset: () => void }) {
  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex size-16 animate-in items-center justify-center rounded-full bg-stamp-teal text-stamp-teal-foreground zoom-in-50 fade-in duration-300">
          <Check className="size-8" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl">Borrador confirmado</h1>
        <p className="text-muted-foreground">
          Se crearon {result.workExperiences.length}{" "}
          {result.workExperiences.length === 1 ? "experiencia laboral" : "experiencias laborales"} y{" "}
          {result.bullets.length} {result.bullets.length === 1 ? "logro" : "logros"}.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/applications" className={buttonVariants({ size: "lg" })}>
            Ir a postulaciones
          </Link>
          <Button size="lg" variant="outline" onClick={onReset}>
            Importar otro CV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
