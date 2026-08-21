// Mismo shape que backend/src/job-descriptions/job-description.ts — duplicado a
// mano porque backend/ y frontend/ son dos proyectos npm separados, sin
// paquete de tipos compartido (ver plan: prematuro para una sola pantalla).

export type JobDescription = {
  id: string;
  company: string;
  role: string;
  rawText: string;
  createdAt: string; // ISO — viene serializado por fetch().json()
};
