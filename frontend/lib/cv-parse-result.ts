// Mismo shape que backend/src/cv-import/cv-parse-result.ts — duplicado a
// mano porque backend/ y frontend/ son dos proyectos npm separados, sin
// paquete de tipos compartido (ver plan: prematuro para una sola pantalla).

export type DraftBullet = {
  text: string;
};

export type DraftWorkExperience = {
  company: string;
  role: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null; // "YYYY-MM-DD" | null
  bullets: DraftBullet[];
};

export type CVParseResult = {
  workExperiences: DraftWorkExperience[];
};

export type ConfirmCVResult = {
  workExperiences: { id: string; company: string; role: string }[];
  bullets: { id: string; text: string; workExperienceId: string }[];
};
