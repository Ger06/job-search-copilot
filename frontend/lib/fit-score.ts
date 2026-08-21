export type FitScoreLabel = "Bajo" | "Medio" | "Alto";

// Primera aproximación con un solo dato de calibración real, ajustar con
// más CVs generados. Con embeddings de oraciones (MiniLM) comparando un
// texto largo (la vacante completa) contra textos cortos (bullets), un
// match genuinamente fuerte rara vez da una similitud cercana a 1.0 — por
// eso estos umbrales no son una escala 0–100 tipo nota de examen.
export function getFitScoreLabel(fitScore: number | null): FitScoreLabel | null {
  if (fitScore === null) return null;
  if (fitScore < 0.25) return "Bajo";
  if (fitScore <= 0.45) return "Medio";
  return "Alto";
}
