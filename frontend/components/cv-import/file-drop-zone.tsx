"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError, extractTextFromFile } from "@/lib/backend-client";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "docx"];

function isAllowedFile(file: File): boolean {
  const extension = file.name.toLowerCase().split(".").pop();
  return extension !== undefined && ALLOWED_EXTENSIONS.includes(extension);
}

export function FileDropZone({ onTextExtracted }: { onTextExtracted: (text: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!isAllowedFile(file)) {
      setError("Solo se admiten archivos .pdf o .docx.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("El archivo supera el tamaño máximo permitido (5MB).");
      return;
    }

    setIsLoading(true);
    try {
      const { text } = await extractTextFromFile(file);
      onTextExtracted(text);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
        }`}
      >
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Extrayendo texto..." : "Arrastrá tu CV acá (.pdf o .docx)"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          disabled={isLoading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={isLoading} onClick={() => inputRef.current?.click()}>
          Elegir archivo
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
