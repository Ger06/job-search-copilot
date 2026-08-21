import { describe, expect, it } from "vitest";
import { parseCVText } from "../parse-cv-text.js";
import { GroqLLMProvider } from "../../ports/groq-llm-provider.js";

const SAMPLE_CV_TEXT = `Juan Pérez
juan.perez@email.com | +54 9 11 1234 5678 | linkedin.com/in/juanperez

Resumen profesional
Ingeniero de software con experiencia en backend y liderazgo técnico.

Experiencia laboral

Backend Engineer — Beta Inc
Marzo 2020 - Junio 2022
- Reduje el tiempo de build en 40% optimizando el pipeline de CI
- Lideré un equipo de 5 personas en la migración a microservicios

Frontend Developer — Gamma LLC
Julio 2022 - presente
- Mejoré el Lighthouse score de 62 a 95 en la landing principal
- Reduje el bundle size en 30% con code splitting

Educación
Ingeniería en Sistemas — Universidad de Buenos Aires (2014 - 2019)

Habilidades
TypeScript, Node.js, React, PostgreSQL`;

function extractNumbers(text: string): string[] {
  return text.match(/\d+(\.\d+)?%?/g) ?? [];
}

describe("parseCVText (eval con Groq real, integración)", () => {
  it(
    "extrae una cantidad razonable de work experiences, sin bullets vacíos y sin números inventados",
    async () => {
      const llmProvider = new GroqLLMProvider();

      const result = await parseCVText(SAMPLE_CV_TEXT, llmProvider);

      // Eval 1 — cantidad razonable: las dos experiencias reales, ninguna de más.
      expect(result.workExperiences).toHaveLength(2);
      const companies = result.workExperiences.map((we) => we.company);
      expect(companies.some((company) => company.includes("Beta Inc"))).toBe(true);
      expect(companies.some((company) => company.includes("Gamma LLC"))).toBe(true);

      // Eval 2 — ningún bullet vacío (ya lo garantiza validateParsedCVStructure
      // dentro de parseCVText si el resultado llegó hasta acá; queda como
      // sanity check explícito, mismo criterio que el eval de cobertura
      // redundante del agente de generación).
      const allBullets = result.workExperiences.flatMap((we) => we.bullets);
      expect(allBullets.length).toBeGreaterThan(0);
      for (const bullet of allBullets) {
        expect(bullet.text.trim().length).toBeGreaterThan(0);
      }

      // Eval 3 — honestidad: todo número que aparece en un bullet extraído
      // aparece literalmente en el texto fuente del CV.
      for (const bullet of allBullets) {
        for (const number of extractNumbers(bullet.text)) {
          expect(SAMPLE_CV_TEXT.includes(number)).toBe(true);
        }
      }

      // Eval 4 — fechas parseables.
      for (const workExperience of result.workExperiences) {
        expect(Number.isNaN(new Date(workExperience.startDate).getTime())).toBe(false);
        if (workExperience.endDate !== null) {
          expect(Number.isNaN(new Date(workExperience.endDate).getTime())).toBe(false);
        }
      }
    },
    60000,
  );
});
