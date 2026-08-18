import { describe, expect, it } from "vitest";
import {
  createWorkExperience,
  findWorkExperienceById,
  listWorkExperiences,
} from "../work-experience-service.js";
import { InMemoryWorkExperienceRepository } from "../in-memory-work-experience-repository.js";

describe("createWorkExperience", () => {
  it("crea un work experience con la company dada", () => {
    const workExperience = createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.company).toBe("Acme Corp");
  });

  it("asigna un id único a cada work experience creado", () => {
    const repository = new InMemoryWorkExperienceRepository();
    const first = createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      repository,
    );
    const second = createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      repository,
    );

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);
  });

  it("asigna el role dado", () => {
    const workExperience = createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.role).toBe("Backend Engineer");
  });

  it("asigna el startDate dado", () => {
    const startDate = new Date("2022-01-15");
    const workExperience = createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate,
        order: 1,
      },
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.startDate).toBe(startDate);
  });

  it("crea un work experience sin endDate cuando el trabajo sigue en curso", () => {
    const workExperience = createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.endDate).toBeUndefined();
  });

  it("asigna el endDate dado cuando se pasa", () => {
    const endDate = new Date("2023-06-30");
    const workExperience = createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        endDate,
        order: 1,
      },
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.endDate).toBe(endDate);
  });

  it("asigna el order dado", () => {
    const workExperience = createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.order).toBe(1);
  });

  it("persiste el work experience en el repo", () => {
    const repository = new InMemoryWorkExperienceRepository();

    const workExperience = createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      repository,
    );

    expect(repository.findById(workExperience.id)).toEqual(workExperience);
  });
});

describe("findWorkExperienceById", () => {
  it("devuelve undefined si no existe un work experience con ese id", () => {
    const repository = new InMemoryWorkExperienceRepository();

    const result = findWorkExperienceById("no-existe", repository);

    expect(result).toBeUndefined();
  });
});

describe("listWorkExperiences", () => {
  it("devuelve todos los work experiences guardados", () => {
    const repository = new InMemoryWorkExperienceRepository();
    const first = createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      repository,
    );
    const second = createWorkExperience(
      {
        company: "Beta Inc",
        role: "Tech Lead",
        startDate: new Date("2023-07-01"),
        order: 2,
      },
      repository,
    );

    const result = listWorkExperiences(repository);

    expect(result).toEqual([first, second]);
  });
});
