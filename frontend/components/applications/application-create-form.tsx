"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError, createApplication, createJobDescription } from "@/lib/backend-client";
import type { JobDescription } from "@/lib/job-description";

type Step = "form" | "submitting";

export function ApplicationCreateForm() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [rawText, setRawText] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [savedJobDescription, setSavedJobDescription] = useState<JobDescription | null>(null);

  const canSubmit = company.trim().length > 0 && role.trim().length > 0 && rawText.trim().length > 0;

  async function handleSubmit() {
    setStep("submitting");
    setError(null);

    let jobDescription: JobDescription;
    try {
      jobDescription = await createJobDescription({ company, role, rawText });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
      setStep("form");
      return;
    }

    setSavedJobDescription(jobDescription);

    try {
      await createApplication({ jobDescriptionId: jobDescription.id });
      router.push("/applications");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Ocurrió un error inesperado.";
      setError(
        `Se guardó la publicación de "${jobDescription.company} — ${jobDescription.role}", pero no se pudo crear la postulación: ${message}`,
      );
      setStep("form");
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Nueva postulación</CardTitle>
        <CardDescription>Cargá la vacante a la que te vas a postular.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company">Empresa</Label>
          <Input id="company" value={company} onChange={(event) => setCompany(event.target.value)} disabled={step === "submitting"} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role">Puesto</Label>
          <Input id="role" value={role} onChange={(event) => setRole(event.target.value)} disabled={step === "submitting"} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rawText">Texto de la publicación</Label>
          <Textarea
            id="rawText"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Pegá acá el texto completo de la vacante..."
            className="min-h-80 font-mono text-sm"
            disabled={step === "submitting"}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo crear la postulación</AlertTitle>
            <AlertDescription>
              {error}
              {savedJobDescription && (
                <>
                  {" "}
                  <Link href="/applications" className="underline underline-offset-4">
                    Volver a postulaciones
                  </Link>
                  .
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button size="lg" disabled={!canSubmit || step === "submitting"} onClick={handleSubmit} className="self-end">
          {step === "submitting" ? "Creando..." : "Crear postulación"}
        </Button>
      </CardContent>
    </Card>
  );
}
