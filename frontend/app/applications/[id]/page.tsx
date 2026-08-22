"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError, getJson } from "@/lib/backend-client";
import type { Application } from "@/lib/application";
import type { JobDescription } from "@/lib/job-description";
import type { SavedCV } from "@/lib/saved-cv";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; application: Application; jobDescription: JobDescription | undefined; savedCV: SavedCV | null };

export default function ApplicationDetailPage(props: PageProps<"/applications/[id]">) {
  const { id } = use(props.params);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    async function load() {
      try {
        const [applications, jobDescriptions] = await Promise.all([
          getJson<Application[]>("/applications"),
          getJson<JobDescription[]>("/job-descriptions"),
        ]);

        const application = applications.find((a) => a.id === id);
        if (!application) {
          setState({ status: "not-found" });
          return;
        }

        const jobDescription = jobDescriptions.find((jd) => jd.id === application.jobDescriptionId);
        const savedCV = application.savedCvId ? await getJson<SavedCV>(`/saved-cvs/${application.savedCvId}`) : null;

        setState({ status: "ready", application, jobDescription, savedCV });
      } catch (err) {
        setState({ status: "error", message: err instanceof ApiError ? err.message : "Ocurrió un error inesperado." });
      }
    }

    load();
  }, [id]);

  if (state.status === "loading") {
    return (
      <main className="flex flex-1 flex-col px-6 py-12">
        <p className="text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-12">
        <p className="text-muted-foreground">No encontramos esta postulación.</p>
        <Link href="/applications" className="text-sm text-primary underline-offset-4 hover:underline">
          ← Volver a postulaciones
        </Link>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex flex-1 flex-col px-6 py-12">
        <Alert variant="destructive" className="mx-auto w-full max-w-2xl">
          <AlertTitle>No se pudo cargar la postulación</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      </main>
    );
  }

  const { application, jobDescription, savedCV } = state;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-12">
      <div>
        <Link href="/applications" className="text-sm text-primary underline-offset-4 hover:underline">
          ← Volver a postulaciones
        </Link>
      </div>

      <div>
        <h1 className="text-2xl">
          {jobDescription?.company ?? "—"} — {jobDescription?.role ?? "—"}
        </h1>
        <p className="text-muted-foreground">Estado: {application.status}</p>
      </div>

      {!savedCV && (
        <p className="text-muted-foreground">Todavía no se generó un CV para esta postulación.</p>
      )}

      {savedCV && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">CV generado</p>
            <pre className="min-h-40 rounded-xl border border-border bg-card p-4 font-mono text-xs whitespace-pre-wrap text-foreground">
              {savedCV.content}
            </pre>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Carta de presentación</p>
            <pre className="min-h-40 rounded-xl border border-border bg-card p-4 font-mono text-xs whitespace-pre-wrap text-foreground">
              {savedCV.coverLetterContent}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}
