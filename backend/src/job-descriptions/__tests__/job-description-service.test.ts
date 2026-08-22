import { describe, expect, it } from "vitest";
import {
  createJobDescription,
  findJobDescriptionById,
  listJobDescriptions,
} from "../job-description-service.js";
import { InMemoryJobDescriptionRepository } from "../in-memory-job-description-repository.js";
import { DuplicateError } from "../../errors/duplicate-error.js";
import { TEST_SESSION_ID, OTHER_TEST_SESSION_ID } from "../../__tests__/test-app-dependencies.js";

describe("createJobDescription", () => {
  it("crea una JobDescription con la company dada", async () => {
    const jobDescription = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      new InMemoryJobDescriptionRepository(),
    );

    expect(jobDescription.company).toBe("Acme Corp");
  });

  it("asigna el role dado", async () => {
    const jobDescription = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      new InMemoryJobDescriptionRepository(),
    );

    expect(jobDescription.role).toBe("Backend Engineer");
  });

  it("asigna el rawText dado", async () => {
    const jobDescription = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      new InMemoryJobDescriptionRepository(),
    );

    expect(jobDescription.rawText).toBe(
      "Buscamos un Backend Engineer con experiencia en Node.js",
    );
  });

  it("asigna un id único a cada JobDescription creada", async () => {
    const repository = new InMemoryJobDescriptionRepository();
    const first = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      repository,
    );
    const second = await createJobDescription(
      {
        company: "Beta Inc",
        role: "Tech Lead",
        rawText: "Buscamos un Tech Lead con experiencia en equipos distribuidos",
      },
      TEST_SESSION_ID,
      repository,
    );

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);
  });

  it("asigna la fecha de creación a la JobDescription creada", async () => {
    const before = new Date();
    const jobDescription = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      new InMemoryJobDescriptionRepository(),
    );
    const after = new Date();

    expect(jobDescription.createdAt).toBeInstanceOf(Date);
    expect(jobDescription.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(jobDescription.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("persiste la JobDescription en el repo", async () => {
    const repository = new InMemoryJobDescriptionRepository();

    const jobDescription = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      repository,
    );

    expect(await repository.findById(jobDescription.id, TEST_SESSION_ID)).toEqual(jobDescription);
  });
});

describe("findJobDescriptionById", () => {
  it("devuelve undefined si no existe una JobDescription con ese id", async () => {
    const repository = new InMemoryJobDescriptionRepository();

    const result = await findJobDescriptionById("no-existe", TEST_SESSION_ID, repository);

    expect(result).toBeUndefined();
  });

  it("devuelve undefined si la JobDescription existe pero es de otra sesión", async () => {
    const repository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createJobDescription(
      { company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer" },
      TEST_SESSION_ID,
      repository,
    );

    const result = await findJobDescriptionById(jobDescription.id, OTHER_TEST_SESSION_ID, repository);

    expect(result).toBeUndefined();
  });
});

describe("listJobDescriptions", () => {
  it("devuelve todas las JobDescriptions guardadas en esa sesión", async () => {
    const repository = new InMemoryJobDescriptionRepository();
    const first = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      repository,
    );
    const second = await createJobDescription(
      {
        company: "Beta Inc",
        role: "Tech Lead",
        rawText: "Buscamos un Tech Lead con experiencia en equipos distribuidos",
      },
      TEST_SESSION_ID,
      repository,
    );

    const result = await listJobDescriptions(TEST_SESSION_ID, repository);

    expect(result).toEqual([first, second]);
  });

  it("una sesión no ve las JobDescription creadas por otra sesión", async () => {
    const repository = new InMemoryJobDescriptionRepository();
    await createJobDescription(
      { company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer" },
      TEST_SESSION_ID,
      repository,
    );

    const result = await listJobDescriptions(OTHER_TEST_SESSION_ID, repository);

    expect(result).toEqual([]);
  });
});

describe("createJobDescription — duplicados", () => {
  it("crea la JobDescription cuando no existe ninguna previa con la misma company y role", async () => {
    const repository = new InMemoryJobDescriptionRepository();

    const jobDescription = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      repository,
    );

    expect(jobDescription.company).toBe("Acme Corp");
  });

  it("lanza DuplicateError si ya existe una JobDescription con la misma company y role en la misma sesión", async () => {
    const repository = new InMemoryJobDescriptionRepository();
    await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      repository,
    );

    await expect(
      createJobDescription(
        {
          company: "Acme Corp",
          role: "Backend Engineer",
          rawText: "Otra vacante distinta, mismo puesto",
        },
        TEST_SESSION_ID,
        repository,
      ),
    ).rejects.toThrow(
      new DuplicateError("JobDescription", { company: "Acme Corp", role: "Backend Engineer" }),
    );
  });

  it("permite crear una JobDescription con la misma company pero distinto role", async () => {
    const repository = new InMemoryJobDescriptionRepository();
    await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      repository,
    );

    const jobDescription = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Tech Lead",
        rawText: "Buscamos un Tech Lead con experiencia en equipos distribuidos",
      },
      TEST_SESSION_ID,
      repository,
    );

    expect(jobDescription.role).toBe("Tech Lead");
  });

  it("lanza DuplicateError si ya existe la misma company y role salvo mayúsculas y espacios", async () => {
    const repository = new InMemoryJobDescriptionRepository();
    await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      repository,
    );

    await expect(
      createJobDescription(
        {
          company: "acme corp ",
          role: " backend engineer",
          rawText: "Otra vacante distinta, mismo puesto",
        },
        TEST_SESSION_ID,
        repository,
      ),
    ).rejects.toThrow(DuplicateError);
  });

  it("permite crear la misma company y role en sesiones distintas (no hay conflicto cruzado)", async () => {
    const repository = new InMemoryJobDescriptionRepository();
    await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      TEST_SESSION_ID,
      repository,
    );

    const jobDescription = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Otra vacante, otra sesión",
      },
      OTHER_TEST_SESSION_ID,
      repository,
    );

    expect(jobDescription.company).toBe("Acme Corp");
  });
});
