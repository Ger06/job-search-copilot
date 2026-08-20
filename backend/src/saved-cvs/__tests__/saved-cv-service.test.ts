import { describe, expect, it } from "vitest";
import { createSavedCV, findSavedCVById, listSavedCVs } from "../saved-cv-service.js";
import { InMemorySavedCVRepository } from "../in-memory-saved-cv-repository.js";
import { createJobDescription } from "../../job-descriptions/job-description-service.js";
import { InMemoryJobDescriptionRepository } from "../../job-descriptions/in-memory-job-description-repository.js";
import { NotFoundError } from "../../errors/not-found-error.js";

function createTestJobDescription(repository: InMemoryJobDescriptionRepository) {
  return createJobDescription(
    {
      company: "Acme Corp",
      role: "Backend Engineer",
      rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
    },
    repository,
  );
}

describe("createSavedCV", () => {
  it("crea un SavedCV con el content dado", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);

    const savedCV = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "CV generado para Acme Corp",
        coverLetterContent: "Cover letter generada para Acme Corp",
      },
      new InMemorySavedCVRepository(),
      jobDescriptionRepository,
    );

    expect(savedCV.content).toBe("CV generado para Acme Corp");
  });

  it("asigna el coverLetterContent dado al SavedCV creado", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);

    const savedCV = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "CV generado para Acme Corp",
        coverLetterContent: "Cover letter generada para Acme Corp",
      },
      new InMemorySavedCVRepository(),
      jobDescriptionRepository,
    );

    expect(savedCV.coverLetterContent).toBe("Cover letter generada para Acme Corp");
  });

  it("asigna un id único a cada SavedCV creado", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const savedCVRepository = new InMemorySavedCVRepository();

    const first = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "CV generado para Acme Corp",
        coverLetterContent: "Cover letter generada para Acme Corp",
      },
      savedCVRepository,
      jobDescriptionRepository,
    );
    const second = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "Otra variante del CV",
        coverLetterContent: "Otra variante de la cover letter",
      },
      savedCVRepository,
      jobDescriptionRepository,
    );

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);
  });

  it("asigna la fecha de creación al SavedCV creado", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);

    const before = new Date();
    const savedCV = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "CV generado para Acme Corp",
        coverLetterContent: "Cover letter generada para Acme Corp",
      },
      new InMemorySavedCVRepository(),
      jobDescriptionRepository,
    );
    const after = new Date();

    expect(savedCV.createdAt).toBeInstanceOf(Date);
    expect(savedCV.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(savedCV.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("asigna el jobDescriptionId dado al SavedCV creado", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);

    const savedCV = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "CV generado para Acme Corp",
        coverLetterContent: "Cover letter generada para Acme Corp",
      },
      new InMemorySavedCVRepository(),
      jobDescriptionRepository,
    );

    expect(savedCV.jobDescriptionId).toBe(jobDescription.id);
  });

  it("lanza NotFoundError si el jobDescriptionId no corresponde a ninguna JobDescription existente", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const savedCVRepository = new InMemorySavedCVRepository();

    await expect(
      createSavedCV(
        {
          jobDescriptionId: "no-existe",
          content: "CV generado para Acme Corp",
          coverLetterContent: "Cover letter generada para Acme Corp",
        },
        savedCVRepository,
        jobDescriptionRepository,
      ),
    ).rejects.toThrow(new NotFoundError("JobDescription", "no-existe"));
  });

  it("persiste el SavedCV en el repo", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const savedCVRepository = new InMemorySavedCVRepository();

    const savedCV = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "CV generado para Acme Corp",
        coverLetterContent: "Cover letter generada para Acme Corp",
      },
      savedCVRepository,
      jobDescriptionRepository,
    );

    expect(await savedCVRepository.findById(savedCV.id)).toEqual(savedCV);
  });
});

describe("findSavedCVById", () => {
  it("devuelve undefined si no existe un SavedCV con ese id", async () => {
    const repository = new InMemorySavedCVRepository();

    const result = await findSavedCVById("no-existe", repository);

    expect(result).toBeUndefined();
  });
});

describe("listSavedCVs", () => {
  it("devuelve todos los SavedCV guardados", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const savedCVRepository = new InMemorySavedCVRepository();

    const first = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "CV generado para Acme Corp",
        coverLetterContent: "Cover letter generada para Acme Corp",
      },
      savedCVRepository,
      jobDescriptionRepository,
    );
    const second = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "Otra variante del CV",
        coverLetterContent: "Otra variante de la cover letter",
      },
      savedCVRepository,
      jobDescriptionRepository,
    );

    const result = await listSavedCVs(savedCVRepository);

    expect(result).toEqual([first, second]);
  });
});

describe("createSavedCV — sin chequeo de duplicados", () => {
  it("permite crear dos SavedCV distintos para el mismo jobDescriptionId", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const savedCVRepository = new InMemorySavedCVRepository();

    const first = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "Primera variante del CV",
        coverLetterContent: "Primera variante de la cover letter",
      },
      savedCVRepository,
      jobDescriptionRepository,
    );
    const second = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "Segunda variante del CV",
        coverLetterContent: "Segunda variante de la cover letter",
      },
      savedCVRepository,
      jobDescriptionRepository,
    );

    expect(first.id).not.toBe(second.id);
    expect(await listSavedCVs(savedCVRepository)).toEqual([first, second]);
  });
});
