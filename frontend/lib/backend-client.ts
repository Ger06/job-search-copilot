import type { CVParseResult, ConfirmCVResult } from "./cv-parse-result";
import type { JobDescription } from "./job-description";
import type { Application, ApplicationStatus } from "./application";
import type { SavedCV } from "./saved-cv";
import type { WorkExperience } from "./work-experience";

export class ApiError extends Error {}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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

export function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(() => fetch(`${API_URL}${path}`));
}

export function patchJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(() =>
    fetch(`${API_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
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

export function createJobDescription(input: {
  company: string;
  role: string;
  rawText: string;
}): Promise<JobDescription> {
  return postJson<JobDescription>("/job-descriptions", input);
}

export function listJobDescriptions(): Promise<JobDescription[]> {
  return getJson<JobDescription[]>("/job-descriptions");
}

export function createApplication(input: { jobDescriptionId: string }): Promise<Application> {
  return postJson<Application>("/applications", input);
}

export function listApplications(): Promise<Application[]> {
  return getJson<Application[]>("/applications");
}

export function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<Application> {
  return patchJson<Application>(`/applications/${id}/status`, { status });
}

export function generateCvForApplication(id: string): Promise<Application> {
  return postJson<Application>(`/applications/${id}/generate-cv`, {});
}

export function listWorkExperiences(): Promise<WorkExperience[]> {
  return getJson<WorkExperience[]>("/work-experiences");
}

export function getSavedCV(id: string): Promise<SavedCV> {
  return getJson<SavedCV>(`/saved-cvs/${id}`);
}
