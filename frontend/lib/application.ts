// Mismo shape que backend/src/applications/application.ts — duplicado a
// mano porque backend/ y frontend/ son dos proyectos npm separados, sin
// paquete de tipos compartido (ver plan: prematuro para una sola pantalla).

export type ApplicationStatus = "pendiente" | "enviada" | "entrevista" | "rechazada" | "oferta";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "pendiente",
  "enviada",
  "entrevista",
  "rechazada",
  "oferta",
];

export type Application = {
  id: string;
  jobDescriptionId: string;
  savedCvId: string | null;
  status: ApplicationStatus;
  recruiter: string | null;
  portal: string | null;
  salaryRequested: string | null;
  fitScore: number | null;
  notes: string | null;
  createdAt: string; // ISO — viene serializado por fetch().json()
  updatedAt: string;
};
