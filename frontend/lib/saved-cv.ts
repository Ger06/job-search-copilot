// Mismo shape que backend/src/saved-cvs/saved-cv.ts — duplicado a
// mano porque backend/ y frontend/ son dos proyectos npm separados, sin
// paquete de tipos compartido (ver plan: prematuro para una sola pantalla).

export type SavedCV = {
  id: string;
  jobDescriptionId: string;
  content: string;
  coverLetterContent: string;
  createdAt: string; // ISO — viene serializado por fetch().json()
};
