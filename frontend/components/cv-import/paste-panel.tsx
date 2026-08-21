"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Importar CV</CardTitle>
        <CardDescription>
          Pegá el texto completo de tu currículum. Vamos a extraer tu experiencia laboral como borrador — no se
          guarda nada todavía.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FileDropZone onTextExtracted={setRawText} />
        <Textarea
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="Pegá acá el texto de tu CV..."
          className="min-h-80 font-mono text-sm"
          disabled={isLoading}
        />
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
  );
}
