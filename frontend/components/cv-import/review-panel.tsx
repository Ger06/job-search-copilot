"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WorkExperienceCard } from "./work-experience-card";
import type { CVParseResult, DraftWorkExperience } from "@/lib/cv-parse-result";

function isDraftValid(draft: CVParseResult): boolean {
  return draft.workExperiences.every(
    (workExperience) =>
      workExperience.company.trim().length > 0 &&
      workExperience.role.trim().length > 0 &&
      workExperience.bullets.every((bullet) => bullet.text.trim().length > 0),
  );
}

export function ReviewPanel({
  rawText,
  draft,
  onDraftChange,
  isLoading,
  error,
  onConfirm,
}: {
  rawText: string;
  draft: CVParseResult;
  onDraftChange: (draft: CVParseResult) => void;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
}) {
  function updateWorkExperience(index: number, next: DraftWorkExperience) {
    const workExperiences = draft.workExperiences.map((we, i) => (i === index ? next : we));
    onDraftChange({ workExperiences });
  }

  const canConfirm = isDraftValid(draft) && !isLoading;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Revisar borrador</h1>
        <Button size="lg" disabled={!canConfirm} onClick={onConfirm}>
          {isLoading ? "Guardando..." : "Confirmar →"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo confirmar el borrador</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Manuscrito (original)</p>
          <pre className="h-[70vh] overflow-y-auto rounded-xl border border-border bg-card p-4 font-mono text-xs whitespace-pre-wrap text-foreground">
            {rawText}
          </pre>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Prueba (editable)</p>
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
            {draft.workExperiences.map((workExperience, index) => (
              <WorkExperienceCard
                key={index}
                index={index}
                workExperience={workExperience}
                onChange={(next) => updateWorkExperience(index, next)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
