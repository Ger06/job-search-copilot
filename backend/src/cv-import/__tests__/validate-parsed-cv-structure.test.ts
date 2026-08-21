import { describe, expect, it } from "vitest";
import { validateParsedCVStructure } from "../validate-parsed-cv-structure.js";
import type { CVParseResult } from "../cv-parse-result.js";

function createValidResult(): CVParseResult {
  return {
    workExperiences: [
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: "2020-01-01",
        endDate: "2022-06-01",
        bullets: [{ text: "Reduje el tiempo de build en 40%" }],
      },
    ],
  };
}

describe("validateParsedCVStructure", () => {
  it("no lanza nada con un CVParseResult bien formado", () => {
    expect(() => validateParsedCVStructure(createValidResult())).not.toThrow();
  });

  it("lanza si algún bullet tiene text vacío", () => {
    const result = createValidResult();
    result.workExperiences[0]!.bullets.push({ text: "   " });

    expect(() => validateParsedCVStructure(result)).toThrow();
  });

  it("lanza si company está vacío", () => {
    const result = createValidResult();
    result.workExperiences[0]!.company = "";

    expect(() => validateParsedCVStructure(result)).toThrow();
  });

  it("lanza si role está vacío", () => {
    const result = createValidResult();
    result.workExperiences[0]!.role = "  ";

    expect(() => validateParsedCVStructure(result)).toThrow();
  });

  it("lanza si startDate no parsea como fecha válida", () => {
    const result = createValidResult();
    result.workExperiences[0]!.startDate = "no-es-una-fecha";

    expect(() => validateParsedCVStructure(result)).toThrow();
  });

  it("lanza si endDate (no nulo) no parsea como fecha válida", () => {
    const result = createValidResult();
    result.workExperiences[0]!.endDate = "no-es-una-fecha";

    expect(() => validateParsedCVStructure(result)).toThrow();
  });

  it("no lanza nada si endDate es null", () => {
    const result = createValidResult();
    result.workExperiences[0]!.endDate = null;

    expect(() => validateParsedCVStructure(result)).not.toThrow();
  });

  it("no lanza nada si workExperiences está vacío", () => {
    expect(() => validateParsedCVStructure({ workExperiences: [] })).not.toThrow();
  });
});
