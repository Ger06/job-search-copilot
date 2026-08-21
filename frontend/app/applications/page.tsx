"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApplicationTracker } from "@/components/applications/application-tracker";
import { API_URL, ApiError, listApplications, listJobDescriptions, listWorkExperiences } from "@/lib/backend-client";
import type { Application } from "@/lib/application";
import type { JobDescription } from "@/lib/job-description";

type LoadState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; applications: Application[]; jobDescriptions: JobDescription[] };

export default function ApplicationsPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  async function load() {
    try {
      const workExperiences = await listWorkExperiences();
      if (workExperiences.length === 0) {
        setState({ status: "empty" });
        return;
      }

      const [applications, jobDescriptions] = await Promise.all([listApplications(), listJobDescriptions()]);
      setState({ status: "ready", applications, jobDescriptions });
    } catch (err) {
      setState({ status: "error", message: err instanceof ApiError ? err.message : "Ocurrió un error inesperado." });
    }
  }

  useEffect(() => {
    // Carga inicial vía fetch — no hay location para moverla a un event
    // handler porque corre al montar, no en respuesta a una acción del
    // usuario. react-hooks/set-state-in-effect no distingue esto de un
    // efecto derivado; lo desactivamos puntualmente acá.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (state.status === "loading") {
    return (
      <main className="flex flex-1 flex-col px-6 py-12">
        <p className="text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex flex-1 flex-col px-6 py-12">
        <Alert variant="destructive" className="mx-auto w-full max-w-2xl">
          <AlertTitle>No se pudieron cargar las postulaciones</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (state.status === "empty") {
    return (
      <main className="flex flex-1 flex-col px-6 py-12">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Todavía no cargaste tu experiencia</CardTitle>
            <CardDescription>
              Antes de armar postulaciones necesitamos tu bullet bank. Importá tu CV para empezar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/import" className={buttonVariants({ size: "lg" })}>
              Importar CV
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <h1 className="text-2xl">Postulaciones</h1>
        <div className="flex gap-2">
          <a href={`${API_URL}/applications/export.csv`} className={buttonVariants({ variant: "outline" })}>
            Exportar CSV
          </a>
          <Link href="/applications/new" className={buttonVariants({})}>
            Nueva postulación
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <ApplicationTracker
          applications={state.applications}
          jobDescriptions={state.jobDescriptions}
          onApplicationUpdated={(updated) =>
            setState((prev) =>
              prev.status === "ready"
                ? { ...prev, applications: prev.applications.map((a) => (a.id === updated.id ? updated : a)) }
                : prev,
            )
          }
        />
      </div>
    </main>
  );
}
