// Versión mínima de backend/src/work-experiences/work-experience.ts — el
// frontend hoy solo necesita esto para chequear si el usuario ya cargó
// alguna experiencia laboral (empty-state de /applications), no duplicamos
// el resto de los campos porque no se usan todavía.

export type WorkExperience = {
  id: string;
};
