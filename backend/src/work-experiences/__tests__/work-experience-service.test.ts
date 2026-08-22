import { describe, expect, it } from "vitest";
import {
  createWorkExperience,
  findWorkExperienceById,
  listWorkExperiences,
} from "../work-experience-service.js";
import { InMemoryWorkExperienceRepository } from "../in-memory-work-experience-repository.js";
import { TEST_SESSION_ID, OTHER_TEST_SESSION_ID } from "../../__tests__/test-app-dependencies.js";

describe("createWorkExperience", () => {
  it("crea un work experience con la company dada", async () => {
    const workExperience = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.company).toBe("Acme Corp");
  });

  it("asigna un id único a cada work experience creado", async () => {
    const repository = new InMemoryWorkExperienceRepository();
    const first = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
      repository,
    );
    const second = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
      repository,
    );

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);
  });

  it("asigna el role dado", async () => {
    const workExperience = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.role).toBe("Backend Engineer");
  });

  it("asigna el startDate dado", async () => {
    const startDate = new Date("2022-01-15");
    const workExperience = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate,
        order: 1,
      },
      TEST_SESSION_ID,
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.startDate).toBe(startDate);
  });

  it("crea un work experience sin endDate cuando el trabajo sigue en curso", async () => {
    const workExperience = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.endDate).toBeUndefined();
  });

  it("asigna el endDate dado cuando se pasa", async () => {
    const endDate = new Date("2023-06-30");
    const workExperience = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        endDate,
        order: 1,
      },
      TEST_SESSION_ID,
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.endDate).toBe(endDate);
  });

  it("asigna el order dado", async () => {
    const workExperience = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
      new InMemoryWorkExperienceRepository(),
    );

    expect(workExperience.order).toBe(1);
  });

  it("persiste el work experience en el repo", async () => {
    const repository = new InMemoryWorkExperienceRepository();

    const workExperience = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
      repository,
    );

    expect(await repository.findById(workExperience.id, TEST_SESSION_ID)).toEqual(workExperience);
  });
});

describe("findWorkExperienceById", () => {
  it("devuelve undefined si no existe un work experience con ese id", async () => {
    const repository = new InMemoryWorkExperienceRepository();

    const result = await findWorkExperienceById("no-existe", TEST_SESSION_ID, repository);

    expect(result).toBeUndefined();
  });

  it("devuelve undefined si el work experience existe pero es de otra sesión", async () => {
    const repository = new InMemoryWorkExperienceRepository();
    const workExperience = await createWorkExperience(
      { company: "Acme Corp", role: "Backend Engineer", startDate: new Date("2022-01-15"), order: 1 },
      TEST_SESSION_ID,
      repository,
    );

    const result = await findWorkExperienceById(workExperience.id, OTHER_TEST_SESSION_ID, repository);

    expect(result).toBeUndefined();
  });
});

describe("listWorkExperiences", () => {
  it("devuelve todos los work experiences guardados en esa sesión", async () => {
    const repository = new InMemoryWorkExperienceRepository();
    const first = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
      repository,
    );
    const second = await createWorkExperience(
      {
        company: "Beta Inc",
        role: "Tech Lead",
        startDate: new Date("2023-07-01"),
        order: 2,
      },
      TEST_SESSION_ID,
      repository,
    );

    const result = await listWorkExperiences(TEST_SESSION_ID, repository);

    expect(result).toEqual([first, second]);
  });

  it("una sesión no ve los work experiences creados por otra sesión", async () => {
    const repository = new InMemoryWorkExperienceRepository();
    await createWorkExperience(
      { company: "Acme Corp", role: "Backend Engineer", startDate: new Date("2022-01-15"), order: 1 },
      TEST_SESSION_ID,
      repository,
    );

    const result = await listWorkExperiences(OTHER_TEST_SESSION_ID, repository);

    expect(result).toEqual([]);
  });
});
