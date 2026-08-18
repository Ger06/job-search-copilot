import { describe, expect, it } from "vitest";
import {
  createJobDescription,
  findJobDescriptionById,
  listJobDescriptions,
} from "../job-description-service.js";
import { InMemoryJobDescriptionRepository } from "../in-memory-job-description-repository.js";
import { DuplicateError } from "../../errors/duplicate-error.js";

describe("createJobDescription", () => {
  it("crea una JobDescription con la company dada", () => {
    const jobDescription = createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      new InMemoryJobDescriptionRepository(),
    );

    expect(jobDescription.company).toBe("Acme Corp");
  });

  it("asigna el role dado", () => {
    const jobDescription = createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      new InMemoryJobDescriptionRepository(),
    );

    expect(jobDescription.role).toBe("Backend Engineer");
  });

  it("asigna el rawText dado", () => {
    const jobDescription = createJobDescription(
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

  it("asigna un id único a cada JobDescription creada", () => {
    const repository = new InMemoryJobDescriptionRepository();
    const first = createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      repository,
    );
    const second = createJobDescription(
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

  it("asigna la fecha de creación a la JobDescription creada", () => {
    const before = new Date();
    const jobDescription = createJobDescription(
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

  it("persiste la JobDescription en el repo", () => {
    const repository = new InMemoryJobDescriptionRepository();

    const jobDescription = createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      repository,
    );

    expect(repository.findById(jobDescription.id)).toEqual(jobDescription);
  });
});

describe("findJobDescriptionById", () => {
  it("devuelve undefined si no existe una JobDescription con ese id", () => {
    const repository = new InMemoryJobDescriptionRepository();

    const result = findJobDescriptionById("no-existe", repository);

    expect(result).toBeUndefined();
  });
});

describe("listJobDescriptions", () => {
  it("devuelve todas las JobDescriptions guardadas", () => {
    const repository = new InMemoryJobDescriptionRepository();
    const first = createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      repository,
    );
    const second = createJobDescription(
      {
        company: "Beta Inc",
        role: "Tech Lead",
        rawText: "Buscamos un Tech Lead con experiencia en equipos distribuidos",
      },
      repository,
    );

    const result = listJobDescriptions(repository);

    expect(result).toEqual([first, second]);
  });
});

describe("createJobDescription — duplicados", () => {
  it("crea la JobDescription cuando no existe ninguna previa con la misma company y role", () => {
    const repository = new InMemoryJobDescriptionRepository();

    const jobDescription = createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      repository,
    );

    expect(jobDescription.company).toBe("Acme Corp");
  });

  it("lanza DuplicateError si ya existe una JobDescription con la misma company y role", () => {
    const repository = new InMemoryJobDescriptionRepository();
    createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      repository,
    );

    expect(() =>
      createJobDescription(
        {
          company: "Acme Corp",
          role: "Backend Engineer",
          rawText: "Otra vacante distinta, mismo puesto",
        },
        repository,
      ),
    ).toThrow(new DuplicateError("JobDescription", { company: "Acme Corp", role: "Backend Engineer" }));
  });

  it("permite crear una JobDescription con la misma company pero distinto role", () => {
    const repository = new InMemoryJobDescriptionRepository();
    createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      repository,
    );

    const jobDescription = createJobDescription(
      {
        company: "Acme Corp",
        role: "Tech Lead",
        rawText: "Buscamos un Tech Lead con experiencia en equipos distribuidos",
      },
      repository,
    );

    expect(jobDescription.role).toBe("Tech Lead");
  });

  it("lanza DuplicateError si ya existe la misma company y role salvo mayúsculas y espacios", () => {
    const repository = new InMemoryJobDescriptionRepository();
    createJobDescription(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      },
      repository,
    );

    expect(() =>
      createJobDescription(
        {
          company: "acme corp ",
          role: " backend engineer",
          rawText: "Otra vacante distinta, mismo puesto",
        },
        repository,
      ),
    ).toThrow(DuplicateError);
  });
});
