import { describe, expect, it } from "vitest";
import {
  createJobDescription,
  findJobDescriptionById,
  listJobDescriptions,
} from "../job-description-service.js";
import { InMemoryJobDescriptionRepository } from "../in-memory-job-description-repository.js";
import { DuplicateError } from "../../errors/duplicate-error.js";

describe("createJobDescription", () => {
  it("crea una JobDescription con la company dada", async () => {
    const jobDescription = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
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
      repository,
    );
    const second = await createJobDescription(
      {
        company: "Beta Inc",
        role: "Tech Lead",
        rawText: "Buscamos un Tech Lead con experiencia en equipos distribuidos",
      },
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
      repository,
    );

    expect(await repository.findById(jobDescription.id)).toEqual(jobDescription);
  });
});

describe("findJobDescriptionById", () => {
  it("devuelve undefined si no existe una JobDescription con ese id", async () => {
    const repository = new InMemoryJobDescriptionRepository();

    const result = await findJobDescriptionById("no-existe", repository);

    expect(result).toBeUndefined();
  });
});

describe("listJobDescriptions", () => {
  it("devuelve todas las JobDescriptions guardadas", async () => {
    const repository = new InMemoryJobDescriptionRepository();
    const first = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      repository,
    );
    const second = await createJobDescription(
      {
        company: "Beta Inc",
        role: "Tech Lead",
        rawText: "Buscamos un Tech Lead con experiencia en equipos distribuidos",
      },
      repository,
    );

    const result = await listJobDescriptions(repository);

    expect(result).toEqual([first, second]);
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
      repository,
    );

    expect(jobDescription.company).toBe("Acme Corp");
  });

  it("lanza DuplicateError si ya existe una JobDescription con la misma company y role", async () => {
    const repository = new InMemoryJobDescriptionRepository();
    await createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      repository,
    );

    await expect(
      createJobDescription(
        {
          company: "Acme Corp",
          role: "Backend Engineer",
          rawText: "Otra vacante distinta, mismo puesto",
        },
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
      repository,
    );

    const jobDescription = await createJobDescription(
      {
        company: "Acme Corp",
        role: "Tech Lead",
        rawText: "Buscamos un Tech Lead con experiencia en equipos distribuidos",
      },
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
      repository,
    );

    await expect(
      createJobDescription(
        {
          company: "acme corp ",
          role: " backend engineer",
          rawText: "Otra vacante distinta, mismo puesto",
        },
        repository,
      ),
    ).rejects.toThrow(DuplicateError);
  });
});
