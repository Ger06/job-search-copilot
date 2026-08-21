"use client";

import { useState } from "react";
import { PastePanel } from "./paste-panel";
import { ReviewPanel } from "./review-panel";
import { ConfirmationPanel } from "./confirmation-panel";
import { ApiError, confirmCV, parseCV } from "@/lib/backend-client";
import type { ConfirmCVResult, CVParseResult } from "@/lib/cv-parse-result";

type Stage = "paste" | "review" | "confirmed";

export function CVImportFlow() {
  const [stage, setStage] = useState<Stage>("paste");
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState<CVParseResult | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmCVResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract(text: string) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await parseCV(text);
      setRawText(text);
      setDraft(result);
      setStage("review");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm() {
    if (!draft) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await confirmCV(draft);
      setConfirmResult(result);
      setStage("confirmed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  if (stage === "confirmed" && confirmResult) {
    return <ConfirmationPanel result={confirmResult} />;
  }

  if (stage === "review" && draft) {
    return (
      <ReviewPanel
        rawText={rawText}
        draft={draft}
        onDraftChange={setDraft}
        isLoading={isLoading}
        error={error}
        onConfirm={handleConfirm}
      />
    );
  }

  return <PastePanel isLoading={isLoading} error={error} onSubmit={handleExtract} />;
}
