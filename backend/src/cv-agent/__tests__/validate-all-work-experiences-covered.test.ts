import { describe, expect, it } from "vitest";
import { validateAllWorkExperiencesCovered } from "../validate-all-work-experiences-covered.js";
import { IncompleteCoverageError } from "../../errors/incomplete-coverage-error.js";

describe("validateAllWorkExperiencesCovered", () => {
  it("no lanza nada si la cobertura está completa", () => {
    expect(() => validateAllWorkExperiencesCovered(["we-1", "we-2"], ["we-1", "we-2"])).not.toThrow();
  });

  it("no lanza nada si coveredWorkExperienceIds tiene un id extra que no pertenece a allWorkExperienceIds", () => {
    expect(() => validateAllWorkExperiencesCovered(["we-1", "we-2"], ["we-1", "we-2", "we-extra"])).not.toThrow();
  });

  it("lanza IncompleteCoverageError con el id faltante si falta cubrir una work experience", () => {
    expect(() => validateAllWorkExperiencesCovered(["we-1", "we-2"], ["we-1"])).toThrow(
      new IncompleteCoverageError(["we-2"]),
    );
  });

  it("no lanza nada si allWorkExperienceIds está vacío", () => {
    expect(() => validateAllWorkExperiencesCovered([], [])).not.toThrow();
  });
});
