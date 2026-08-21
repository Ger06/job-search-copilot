"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileDropZone } from "./file-drop-zone";

export function PastePanel({
  isLoading,
  error,
  onSubmit,
}: {
  isLoading: boolean;
  error: string | null;
  onSubmit: (rawText: string) => void;
}) {
  const [rawText, setRawText] = useState("");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div>
        <h1 className="text-2xl">Importar CV</h1>
        <p className="text-muted-foreground">
          Pegá el texto completo de tu currículum. Vamos a extraer tu experiencia laboral como borrador — no se
          guarda nada todavía.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <FileDropZone onTextExtracted={setRawText} />
            <Textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Pegá acá el texto de tu CV..."
              className="min-h-64 font-mono text-sm md:min-h-full"
              disabled={isLoading}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>No se pudo extraer el borrador</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            size="lg"
            disabled={isLoading || rawText.trim().length === 0}
            onClick={() => onSubmit(rawText)}
            className="self-end"
          >
            {isLoading ? "Extrayendo..." : "Extraer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
