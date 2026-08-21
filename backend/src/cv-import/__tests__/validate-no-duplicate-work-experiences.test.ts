import { describe, expect, it } from "vitest";
import { validateNoDuplicateWorkExperiences } from "../validate-no-duplicate-work-experiences.js";
import { InMemoryWorkExperienceRepository } from "../../work-experiences/in-memory-work-experience-repository.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import type { CVParseResult } from "../cv-parse-result.js";

function draftWith(workExperiences: CVParseResult["workExperiences"]): CVParseResult {
  return { workExperiences };
}

describe("validateNoDuplicateWorkExperiences", () => {
  it("no lanza si el repositorio está vacío", async () => {
    const repository = new InMemoryWorkExperienceRepository();
    const draft = draftWith([
      { company: "Acme Corp", role: "Backend Engineer", startDate: "2020-01-01", endDate: null, bullets: [] },
    ]);

    await expect(validateNoDuplicateWorkExperiences(draft, repository)).resolves.toBeUndefined();
  });

  it("lanza DuplicateError si ya existe una WorkExperience con el mismo company, role y startDate", async () => {
    const repository = new InMemoryWorkExperienceRepository();
    await createWorkExperience(
      { company: "Acme Corp", role: "Backend Engineer", startDate: new Date("2020-01-01"), order: 1 },
      repository,
    );
    const draft = draftWith([
      { company: "Acme Corp", role: "Backend Engineer", startDate: "2020-01-01", endDate: null, bullets: [] },
    ]);

    await expect(validateNoDuplicateWorkExperiences(draft, repository)).rejects.toThrow(
      "WorkExperience con company 'Acme Corp' y role 'Backend Engineer' y startDate '2020-01-01' ya existe",
    );
  });

  it("ignora mayúsculas/minúsculas y espacios al comparar company y role", async () => {
    const repository = new InMemoryWorkExperienceRepository();
    await createWorkExperience(
      { company: "Acme Corp", role: "Backend Engineer", startDate: new Date("2020-01-01"), order: 1 },
      repository,
    );
    const draft = draftWith([
      { company: "  ACME CORP  ", role: " backend engineer ", startDate: "2020-01-01", endDate: null, bullets: [] },
    ]);

    await expect(validateNoDuplicateWorkExperiences(draft, repository)).rejects.toThrow("ya existe");
  });

  it("no lanza si company y role coinciden pero el startDate es distinto (re-empleo legítimo)", async () => {
    const repository = new InMemoryWorkExperienceRepository();
    await createWorkExperience(
      { company: "Acme Corp", role: "Backend Engineer", startDate: new Date("2018-01-01"), order: 1 },
      repository,
    );
    const draft = draftWith([
      { company: "Acme Corp", role: "Backend Engineer", startDate: "2021-01-01", endDate: null, bullets: [] },
    ]);

    await expect(validateNoDuplicateWorkExperiences(draft, repository)).resolves.toBeUndefined();
  });
});
