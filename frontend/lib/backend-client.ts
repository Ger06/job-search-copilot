import type { CVParseResult, ConfirmCVResult } from "./cv-parse-result";

export class ApiError extends Error {}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function requestJson<T>(makeRequest: () => Promise<Response>): Promise<T> {
  let response: Response;
  try {
    response = await makeRequest();
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
  }

  if (!response.ok) {
    let message = response.statusText || "Ocurrió un error inesperado.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      // el body no era JSON — nos quedamos con el fallback de statusText
    }
    throw new ApiError(message);
  }

  return (await response.json()) as T;
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(() =>
    fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export function postFormData<T>(path: string, formData: FormData): Promise<T> {
  return requestJson<T>(() => fetch(`${API_URL}${path}`, { method: "POST", body: formData }));
}

export function parseCV(rawText: string): Promise<CVParseResult> {
  return postJson<CVParseResult>("/cv-import/parse", { rawText });
}

export function confirmCV(draft: CVParseResult): Promise<ConfirmCVResult> {
  return postJson<ConfirmCVResult>("/cv-import/confirm", draft);
}

export function extractTextFromFile(file: File): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return postFormData<{ text: string }>("/cv-import/extract-text", formData);
}
