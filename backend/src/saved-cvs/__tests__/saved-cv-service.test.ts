import { describe, expect, it } from "vitest";
import { createSavedCV, findSavedCVById, listSavedCVs } from "../saved-cv-service.js";
import { InMemorySavedCVRepository } from "../in-memory-saved-cv-repository.js";
import { createJobDescription } from "../../job-descriptions/job-description-service.js";
import { InMemoryJobDescriptionRepository } from "../../job-descriptions/in-memory-job-description-repository.js";
import { NotFoundError } from "../../errors/not-found-error.js";
import { TEST_SESSION_ID, OTHER_TEST_SESSION_ID } from "../../__tests__/test-app-dependencies.js";

function createTestJobDescription(repository: InMemoryJobDescriptionRepository, sessionId: string = TEST_SESSION_ID) {
  return createJobDescription(
    {
      company: "Acme Corp",
      role: "Backend Engineer",
      rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
    },
    sessionId,
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
      TEST_SESSION_ID,
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
      TEST_SESSION_ID,
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
      TEST_SESSION_ID,
      savedCVRepository,
      jobDescriptionRepository,
    );
    const second = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "Otra variante del CV",
        coverLetterContent: "Otra variante de la cover letter",
      },
      TEST_SESSION_ID,
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
      TEST_SESSION_ID,
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
      TEST_SESSION_ID,
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
        TEST_SESSION_ID,
        savedCVRepository,
        jobDescriptionRepository,
      ),
    ).rejects.toThrow(new NotFoundError("JobDescription", "no-existe"));
  });

  it("lanza NotFoundError si el jobDescriptionId existe pero es de otra sesión", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository, TEST_SESSION_ID);
    const savedCVRepository = new InMemorySavedCVRepository();

    await expect(
      createSavedCV(
        {
          jobDescriptionId: jobDescription.id,
          content: "CV intruso",
          coverLetterContent: "Cover letter intrusa",
        },
        OTHER_TEST_SESSION_ID,
        savedCVRepository,
        jobDescriptionRepository,
      ),
    ).rejects.toThrow(new NotFoundError("JobDescription", jobDescription.id));
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
      TEST_SESSION_ID,
      savedCVRepository,
      jobDescriptionRepository,
    );

    expect(await savedCVRepository.findById(savedCV.id, TEST_SESSION_ID)).toEqual(savedCV);
  });
});

describe("findSavedCVById", () => {
  it("devuelve undefined si no existe un SavedCV con ese id", async () => {
    const repository = new InMemorySavedCVRepository();

    const result = await findSavedCVById("no-existe", TEST_SESSION_ID, repository);

    expect(result).toBeUndefined();
  });
});

describe("listSavedCVs", () => {
  it("devuelve todos los SavedCV guardados en esa sesión", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const savedCVRepository = new InMemorySavedCVRepository();

    const first = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "CV generado para Acme Corp",
        coverLetterContent: "Cover letter generada para Acme Corp",
      },
      TEST_SESSION_ID,
      savedCVRepository,
      jobDescriptionRepository,
    );
    const second = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "Otra variante del CV",
        coverLetterContent: "Otra variante de la cover letter",
      },
      TEST_SESSION_ID,
      savedCVRepository,
      jobDescriptionRepository,
    );

    const result = await listSavedCVs(TEST_SESSION_ID, savedCVRepository);

    expect(result).toEqual([first, second]);
  });

  it("una sesión no ve los SavedCV creados por otra sesión", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const savedCVRepository = new InMemorySavedCVRepository();

    await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "CV generado para Acme Corp",
        coverLetterContent: "Cover letter generada para Acme Corp",
      },
      TEST_SESSION_ID,
      savedCVRepository,
      jobDescriptionRepository,
    );

    const result = await listSavedCVs(OTHER_TEST_SESSION_ID, savedCVRepository);

    expect(result).toEqual([]);
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
      TEST_SESSION_ID,
      savedCVRepository,
      jobDescriptionRepository,
    );
    const second = await createSavedCV(
      {
        jobDescriptionId: jobDescription.id,
        content: "Segunda variante del CV",
        coverLetterContent: "Segunda variante de la cover letter",
      },
      TEST_SESSION_ID,
      savedCVRepository,
      jobDescriptionRepository,
    );

    expect(first.id).not.toBe(second.id);
    expect(await listSavedCVs(TEST_SESSION_ID, savedCVRepository)).toEqual([first, second]);
  });
});
