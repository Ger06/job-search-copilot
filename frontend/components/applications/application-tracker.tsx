"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/application";
import type { JobDescription } from "@/lib/job-description";
import { ApiError, generateCvForApplication, updateApplicationStatus } from "@/lib/backend-client";
import { getFitScoreLabel, type FitScoreLabel } from "@/lib/fit-score";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pendiente: "Pendiente",
  enviada: "Enviada",
  entrevista: "Entrevista",
  rechazada: "Rechazada",
  oferta: "Oferta",
};

const FIT_SCORE_BADGE_CLASSES: Record<FitScoreLabel, string> = {
  Bajo: "bg-destructive/10 text-destructive",
  Medio: "bg-muted text-muted-foreground",
  Alto: "bg-stamp-teal/10 text-stamp-teal",
};

function FitScoreCell({ fitScore }: { fitScore: number | null }) {
  const label = getFitScoreLabel(fitScore);
  if (label === null || fitScore === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${FIT_SCORE_BADGE_CLASSES[label]}`}>{label}</span>;
}

export function ApplicationTracker({
  applications,
  jobDescriptions,
  onApplicationUpdated,
}: {
  applications: Application[];
  jobDescriptions: JobDescription[];
  onApplicationUpdated: (application: Application) => void;
}) {
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string | null>>({});

  async function handleStatusChange(application: Application, status: ApplicationStatus) {
    const previousStatus = application.status;
    onApplicationUpdated({ ...application, status });
    try {
      const updated = await updateApplicationStatus(application.id, status);
      onApplicationUpdated(updated);
    } catch (err) {
      onApplicationUpdated({ ...application, status: previousStatus });
      setRowErrors((prev) => ({
        ...prev,
        [application.id]: err instanceof ApiError ? err.message : "No se pudo actualizar el estado.",
      }));
    }
  }

  async function handleGenerateCv(applicationId: string) {
    setRowErrors((prev) => ({ ...prev, [applicationId]: null }));
    setGeneratingIds((prev) => new Set(prev).add(applicationId));
    try {
      const updated = await generateCvForApplication(applicationId);
      onApplicationUpdated(updated);
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [applicationId]: err instanceof ApiError ? err.message : "No se pudo generar el CV.",
      }));
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-2 py-2 font-medium">Empresa</th>
              <th className="px-2 py-2 font-medium">Puesto</th>
              <th className="px-2 py-2 font-medium">Estado</th>
              <th className="px-2 py-2 font-medium">Fit score</th>
              <th className="px-2 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => {
              const jobDescription = jobDescriptions.find((jd) => jd.id === application.jobDescriptionId);
              const isGenerating = generatingIds.has(application.id);
              const rowError = rowErrors[application.id];

              return (
                <tr key={application.id} className="border-b border-border last:border-0">
                  <td className="px-2 py-3 align-top">{jobDescription?.company ?? "—"}</td>
                  <td className="px-2 py-3 align-top">{jobDescription?.role ?? "—"}</td>
                  <td className="px-2 py-3 align-top">
                    <select
                      value={application.status}
                      onChange={(event) => handleStatusChange(application, event.target.value as ApplicationStatus)}
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {APPLICATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <FitScoreCell fitScore={application.fitScore} />
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <Button size="sm" disabled={isGenerating} onClick={() => handleGenerateCv(application.id)}>
                          {isGenerating ? "Generando..." : "Generar CV"}
                        </Button>
                        {application.savedCvId && (
                          <Link href={`/applications/${application.id}`} className="text-sm text-primary underline-offset-4 hover:underline">
                            Ver CV
                          </Link>
                        )}
                      </div>
                      {isGenerating && (
                        <p className="text-xs text-muted-foreground">
                          Puede tardar hasta un minuto — es una llamada real a Groq.
                        </p>
                      )}
                      {rowError && <p className="text-xs text-destructive">{rowError}</p>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
