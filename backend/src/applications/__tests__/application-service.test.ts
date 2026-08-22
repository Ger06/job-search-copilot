import { describe, expect, it } from "vitest";
import {
  createApplication,
  linkSavedCVToApplication,
  listApplications,
  listApplicationsAsCsv,
  updateApplicationDetails,
  updateApplicationStatus,
} from "../application-service.js";
import { InMemoryApplicationRepository } from "../in-memory-application-repository.js";
import { createJobDescription } from "../../job-descriptions/job-description-service.js";
import { InMemoryJobDescriptionRepository } from "../../job-descriptions/in-memory-job-description-repository.js";
import { createSavedCV } from "../../saved-cvs/saved-cv-service.js";
import { InMemorySavedCVRepository } from "../../saved-cvs/in-memory-saved-cv-repository.js";
import { NotFoundError } from "../../errors/not-found-error.js";
import { TEST_SESSION_ID, OTHER_TEST_SESSION_ID } from "../../__tests__/test-app-dependencies.js";

function createTestJobDescription(repository: InMemoryJobDescriptionRepository, sessionId: string = TEST_SESSION_ID) {
  return createJobDescription(
    { company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer con experiencia en Node.js" },
    sessionId,
    repository,
  );
}

describe("createApplication", () => {
  it("crea una Application con el jobDescriptionId dado y status 'pendiente' por default", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);

    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      new InMemoryApplicationRepository(),
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );

    expect(application.jobDescriptionId).toBe(jobDescription.id);
    expect(application.status).toBe("pendiente");
  });

  it("savedCvId y fitScore empiezan null cuando no se pasa savedCvId", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);

    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      new InMemoryApplicationRepository(),
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );

    expect(application.savedCvId).toBeNull();
    expect(application.fitScore).toBeNull();
  });

  it("asigna un id único a cada Application creada", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const applicationRepository = new InMemoryApplicationRepository();
    const savedCVRepository = new InMemorySavedCVRepository();

    const first = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      savedCVRepository,
    );
    const second = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      savedCVRepository,
    );

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);
  });

  it("asigna createdAt y updatedAt iguales entre sí al crear", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);

    const before = new Date();
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      new InMemoryApplicationRepository(),
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );
    const after = new Date();

    expect(application.createdAt).toBeInstanceOf(Date);
    expect(application.updatedAt).toEqual(application.createdAt);
    expect(application.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(application.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("lanza NotFoundError si el jobDescriptionId no existe", async () => {
    await expect(
      createApplication(
        { jobDescriptionId: "no-existe" },
        TEST_SESSION_ID,
        new InMemoryApplicationRepository(),
        new InMemoryJobDescriptionRepository(),
        new InMemorySavedCVRepository(),
      ),
    ).rejects.toThrow(new NotFoundError("JobDescription", "no-existe"));
  });

  it("lanza NotFoundError si el jobDescriptionId existe pero es de otra sesión", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository, TEST_SESSION_ID);

    await expect(
      createApplication(
        { jobDescriptionId: jobDescription.id },
        OTHER_TEST_SESSION_ID,
        new InMemoryApplicationRepository(),
        jobDescriptionRepository,
        new InMemorySavedCVRepository(),
      ),
    ).rejects.toThrow(new NotFoundError("JobDescription", jobDescription.id));
  });

  it("persiste la Application en el repo", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const applicationRepository = new InMemoryApplicationRepository();

    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );

    expect(await applicationRepository.findById(application.id, TEST_SESSION_ID)).toEqual(application);
  });

  it("si se pasa savedCvId de un SavedCV existente, la Application creada lo tiene asignado y fitScore sigue null", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const savedCVRepository = new InMemorySavedCVRepository();
    const savedCV = await createSavedCV(
      { jobDescriptionId: jobDescription.id, content: "CV generado", coverLetterContent: "Cover letter generada" },
      TEST_SESSION_ID,
      savedCVRepository,
      jobDescriptionRepository,
    );

    const application = await createApplication(
      { jobDescriptionId: jobDescription.id, savedCvId: savedCV.id },
      TEST_SESSION_ID,
      new InMemoryApplicationRepository(),
      jobDescriptionRepository,
      savedCVRepository,
    );

    expect(application.savedCvId).toBe(savedCV.id);
    expect(application.fitScore).toBeNull();
  });

  it("lanza NotFoundError si el savedCvId pasado no corresponde a ningún SavedCV existente", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);

    await expect(
      createApplication(
        { jobDescriptionId: jobDescription.id, savedCvId: "no-existe" },
        TEST_SESSION_ID,
        new InMemoryApplicationRepository(),
        jobDescriptionRepository,
        new InMemorySavedCVRepository(),
      ),
    ).rejects.toThrow(new NotFoundError("SavedCV", "no-existe"));
  });

  it("lanza NotFoundError si el savedCvId existe pero es de otra sesión", async () => {
    const jobDescriptionRepositoryA = new InMemoryJobDescriptionRepository();
    const jobDescriptionA = await createTestJobDescription(jobDescriptionRepositoryA, TEST_SESSION_ID);
    const savedCVRepository = new InMemorySavedCVRepository();
    const savedCV = await createSavedCV(
      { jobDescriptionId: jobDescriptionA.id, content: "CV generado", coverLetterContent: "Cover letter generada" },
      TEST_SESSION_ID,
      savedCVRepository,
      jobDescriptionRepositoryA,
    );
    // JobDescription propia de la sesión B, para que el chequeo que falle
    // sea específicamente el de savedCvId, no el de jobDescriptionId.
    const jobDescriptionB = await createTestJobDescription(jobDescriptionRepositoryA, OTHER_TEST_SESSION_ID);

    await expect(
      createApplication(
        { jobDescriptionId: jobDescriptionB.id, savedCvId: savedCV.id },
        OTHER_TEST_SESSION_ID,
        new InMemoryApplicationRepository(),
        jobDescriptionRepositoryA,
        savedCVRepository,
      ),
    ).rejects.toThrow(new NotFoundError("SavedCV", savedCV.id));
  });
});

describe("updateApplicationStatus", () => {
  it("actualiza el status al valor dado", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const applicationRepository = new InMemoryApplicationRepository();
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );

    const updated = await updateApplicationStatus(application.id, "enviada", TEST_SESSION_ID, applicationRepository);

    expect(updated.status).toBe("enviada");
  });

  it("actualiza updatedAt a un valor posterior al original", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const applicationRepository = new InMemoryApplicationRepository();
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );
    const originalUpdatedAt = application.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 5));
    const updated = await updateApplicationStatus(application.id, "enviada", TEST_SESSION_ID, applicationRepository);

    expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it("no modifica ningún otro campo", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const savedCVRepository = new InMemorySavedCVRepository();
    const savedCV = await createSavedCV(
      { jobDescriptionId: jobDescription.id, content: "CV generado", coverLetterContent: "Cover letter generada" },
      TEST_SESSION_ID,
      savedCVRepository,
      jobDescriptionRepository,
    );
    const applicationRepository = new InMemoryApplicationRepository();
    const created = await createApplication(
      { jobDescriptionId: jobDescription.id, savedCvId: savedCV.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      savedCVRepository,
    );
    const seeded = await applicationRepository.update(
      {
        ...created,
        recruiter: "Jane Doe",
        portal: "linkedin",
        salaryRequested: "USD 2500",
        fitScore: 0.75,
        notes: "Primer contacto",
      },
      TEST_SESSION_ID,
    );

    const updated = await updateApplicationStatus(seeded.id, "entrevista", TEST_SESSION_ID, applicationRepository);

    expect(updated.createdAt).toEqual(seeded.createdAt);
    expect(updated.jobDescriptionId).toBe(seeded.jobDescriptionId);
    expect(updated.savedCvId).toBe(seeded.savedCvId);
    expect(updated.recruiter).toBe(seeded.recruiter);
    expect(updated.portal).toBe(seeded.portal);
    expect(updated.salaryRequested).toBe(seeded.salaryRequested);
    expect(updated.fitScore).toBe(seeded.fitScore);
    expect(updated.notes).toBe(seeded.notes);
  });

  it("lanza NotFoundError si la Application no existe", async () => {
    await expect(
      updateApplicationStatus("no-existe", "enviada", TEST_SESSION_ID, new InMemoryApplicationRepository()),
    ).rejects.toThrow(new NotFoundError("Application", "no-existe"));
  });

  it("lanza NotFoundError si se intenta actualizar el status de una Application de otra sesión", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository, TEST_SESSION_ID);
    const applicationRepository = new InMemoryApplicationRepository();
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );

    await expect(
      updateApplicationStatus(application.id, "enviada", OTHER_TEST_SESSION_ID, applicationRepository),
    ).rejects.toThrow(new NotFoundError("Application", application.id));
  });
});

// ESTE es el test que confirma el enforcement de ownership en
// ApplicationRepository.update() en sí (no solo en el service, que ya
// filtra antes vía findApplicationOrThrow) — llama al repositorio
// DIRECTAMENTE con una Application creada en session-A, pidiendo el
// update con session-B, sin pasar por ningún chequeo previo del service.
// Si esto no lanzara, el repo permitiría pisar datos de otra sesión
// apenas alguien tuviera el objeto Application en mano.
describe("ApplicationRepository.update — enforcement de ownership a nivel de repo", () => {
  it("lanza NotFoundError si se llama update() directamente con el sessionId de otra sesión", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository, TEST_SESSION_ID);
    const applicationRepository = new InMemoryApplicationRepository();
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );

    await expect(
      applicationRepository.update({ ...application, status: "oferta" }, OTHER_TEST_SESSION_ID),
    ).rejects.toThrow(new NotFoundError("Application", application.id));

    // Confirma que el intento de sesión B no modificó nada: la Application
    // sigue con su status original al leerla de vuelta desde session-A.
    const stillOriginal = await applicationRepository.findById(application.id, TEST_SESSION_ID);
    expect(stillOriginal?.status).toBe("pendiente");
  });
});

describe("updateApplicationDetails", () => {
  async function createSeededApplication(applicationRepository: InMemoryApplicationRepository, sessionId: string = TEST_SESSION_ID) {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository, sessionId);
    const created = await createApplication(
      { jobDescriptionId: jobDescription.id },
      sessionId,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );
    return applicationRepository.update(
      {
        ...created,
        recruiter: "Jane Doe",
        portal: "linkedin",
        salaryRequested: "USD 2500",
        notes: "Primer contacto",
      },
      sessionId,
    );
  }

  it("actualiza solo el campo provisto, el resto de recruiter/portal/salaryRequested/notes queda igual", async () => {
    const applicationRepository = new InMemoryApplicationRepository();
    const seeded = await createSeededApplication(applicationRepository);

    const updated = await updateApplicationDetails(seeded.id, { recruiter: "John Smith" }, TEST_SESSION_ID, applicationRepository);

    expect(updated.recruiter).toBe("John Smith");
    expect(updated.portal).toBe(seeded.portal);
    expect(updated.salaryRequested).toBe(seeded.salaryRequested);
    expect(updated.notes).toBe(seeded.notes);
  });

  it("actualiza varios campos a la vez cuando se proveen varios", async () => {
    const applicationRepository = new InMemoryApplicationRepository();
    const seeded = await createSeededApplication(applicationRepository);

    const updated = await updateApplicationDetails(
      seeded.id,
      { portal: "indeed", salaryRequested: "USD 3000" },
      TEST_SESSION_ID,
      applicationRepository,
    );

    expect(updated.portal).toBe("indeed");
    expect(updated.salaryRequested).toBe("USD 3000");
    expect(updated.recruiter).toBe(seeded.recruiter);
    expect(updated.notes).toBe(seeded.notes);
  });

  it("un campo omitido del input no se toca", async () => {
    const applicationRepository = new InMemoryApplicationRepository();
    const seeded = await createSeededApplication(applicationRepository);

    const updated = await updateApplicationDetails(seeded.id, { notes: "Segundo contacto" }, TEST_SESSION_ID, applicationRepository);

    expect(updated.recruiter).toBe(seeded.recruiter);
    expect(updated.portal).toBe(seeded.portal);
    expect(updated.salaryRequested).toBe(seeded.salaryRequested);
  });

  it("un campo pasado explícitamente como null lo limpia", async () => {
    const applicationRepository = new InMemoryApplicationRepository();
    const seeded = await createSeededApplication(applicationRepository);
    expect(seeded.recruiter).not.toBeNull();

    const updated = await updateApplicationDetails(seeded.id, { recruiter: null }, TEST_SESSION_ID, applicationRepository);

    expect(updated.recruiter).toBeNull();
    expect(updated.portal).toBe(seeded.portal);
  });

  it("actualiza updatedAt", async () => {
    const applicationRepository = new InMemoryApplicationRepository();
    const seeded = await createSeededApplication(applicationRepository);

    await new Promise((resolve) => setTimeout(resolve, 5));
    const updated = await updateApplicationDetails(seeded.id, { notes: "Segundo contacto" }, TEST_SESSION_ID, applicationRepository);

    expect(updated.updatedAt.getTime()).toBeGreaterThan(seeded.updatedAt.getTime());
  });

  it("no toca status, savedCvId, fitScore ni createdAt", async () => {
    const applicationRepository = new InMemoryApplicationRepository();
    const seeded = await createSeededApplication(applicationRepository);

    const updated = await updateApplicationDetails(seeded.id, { notes: "Segundo contacto" }, TEST_SESSION_ID, applicationRepository);

    expect(updated.status).toBe(seeded.status);
    expect(updated.savedCvId).toBe(seeded.savedCvId);
    expect(updated.fitScore).toBe(seeded.fitScore);
    expect(updated.createdAt).toEqual(seeded.createdAt);
  });

  it("lanza NotFoundError si la Application no existe", async () => {
    await expect(
      updateApplicationDetails("no-existe", { recruiter: "John Smith" }, TEST_SESSION_ID, new InMemoryApplicationRepository()),
    ).rejects.toThrow(new NotFoundError("Application", "no-existe"));
  });

  it("lanza NotFoundError si se intenta actualizar detalles de una Application de otra sesión", async () => {
    const applicationRepository = new InMemoryApplicationRepository();
    const seeded = await createSeededApplication(applicationRepository, TEST_SESSION_ID);

    await expect(
      updateApplicationDetails(seeded.id, { recruiter: "Intruso" }, OTHER_TEST_SESSION_ID, applicationRepository),
    ).rejects.toThrow(new NotFoundError("Application", seeded.id));
  });
});

describe("linkSavedCVToApplication", () => {
  async function createSeededApplication(applicationRepository: InMemoryApplicationRepository) {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const created = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );
    return applicationRepository.update(
      {
        ...created,
        status: "entrevista",
        recruiter: "Jane Doe",
        portal: "linkedin",
        salaryRequested: "USD 2500",
        notes: "Primer contacto",
      },
      TEST_SESSION_ID,
    );
  }

  it("actualiza savedCvId y fitScore juntos", async () => {
    const applicationRepository = new InMemoryApplicationRepository();
    const seeded = await createSeededApplication(applicationRepository);

    const updated = await linkSavedCVToApplication(seeded.id, "saved-cv-id", 0.82, TEST_SESSION_ID, applicationRepository);

    expect(updated.savedCvId).toBe("saved-cv-id");
    expect(updated.fitScore).toBe(0.82);
  });

  it("actualiza updatedAt", async () => {
    const applicationRepository = new InMemoryApplicationRepository();
    const seeded = await createSeededApplication(applicationRepository);

    await new Promise((resolve) => setTimeout(resolve, 5));
    const updated = await linkSavedCVToApplication(seeded.id, "saved-cv-id", 0.82, TEST_SESSION_ID, applicationRepository);

    expect(updated.updatedAt.getTime()).toBeGreaterThan(seeded.updatedAt.getTime());
  });

  it("no modifica status, recruiter, portal, salaryRequested, notes ni createdAt", async () => {
    const applicationRepository = new InMemoryApplicationRepository();
    const seeded = await createSeededApplication(applicationRepository);

    const updated = await linkSavedCVToApplication(seeded.id, "saved-cv-id", 0.82, TEST_SESSION_ID, applicationRepository);

    expect(updated.status).toBe(seeded.status);
    expect(updated.recruiter).toBe(seeded.recruiter);
    expect(updated.portal).toBe(seeded.portal);
    expect(updated.salaryRequested).toBe(seeded.salaryRequested);
    expect(updated.notes).toBe(seeded.notes);
    expect(updated.createdAt).toEqual(seeded.createdAt);
  });

  it("lanza NotFoundError si la Application no existe", async () => {
    await expect(
      linkSavedCVToApplication("no-existe", "saved-cv-id", 0.82, TEST_SESSION_ID, new InMemoryApplicationRepository()),
    ).rejects.toThrow(new NotFoundError("Application", "no-existe"));
  });
});

describe("listApplications", () => {
  it("devuelve todas las Applications guardadas en esa sesión", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const applicationRepository = new InMemoryApplicationRepository();
    const savedCVRepository = new InMemorySavedCVRepository();

    const first = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      savedCVRepository,
    );
    const second = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      savedCVRepository,
    );

    expect(await listApplications(TEST_SESSION_ID, applicationRepository)).toEqual([first, second]);
  });

  it("una sesión no ve las Applications creadas por otra sesión", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const applicationRepository = new InMemoryApplicationRepository();

    await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );

    expect(await listApplications(OTHER_TEST_SESSION_ID, applicationRepository)).toEqual([]);
  });
});

describe("listApplicationsAsCsv", () => {
  const CSV_HEADER = "id,company,role,status,recruiter,portal,salaryRequested,fitScore,notes,savedCvId,createdAt,updatedAt";

  it("arma el header correcto", async () => {
    const csv = await listApplicationsAsCsv(
      TEST_SESSION_ID,
      new InMemoryApplicationRepository(),
      new InMemoryJobDescriptionRepository(),
    );

    expect(csv.split("\n")[0]).toBe(CSV_HEADER);
  });

  it("arma una fila con los datos de la Application más company/role de su JobDescription", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const applicationRepository = new InMemoryApplicationRepository();
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );

    const csv = await listApplicationsAsCsv(TEST_SESSION_ID, applicationRepository, jobDescriptionRepository);
    const [, row] = csv.split("\n");

    expect(row).toBe(
      [
        application.id,
        "Acme Corp",
        "Backend Engineer",
        "pendiente",
        "",
        "",
        "",
        "",
        "",
        "",
        application.createdAt.toISOString(),
        application.updatedAt.toISOString(),
      ].join(","),
    );
  });

  it("escapa correctamente un valor con coma", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const applicationRepository = new InMemoryApplicationRepository();
    const created = await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );
    await applicationRepository.update({ ...created, notes: "Habló conmigo, muy interesado" }, TEST_SESSION_ID);

    const csv = await listApplicationsAsCsv(TEST_SESSION_ID, applicationRepository, jobDescriptionRepository);

    expect(csv).toContain('"Habló conmigo, muy interesado"');
  });

  it("con cero Applications, devuelve solo la fila de header", async () => {
    const csv = await listApplicationsAsCsv(
      TEST_SESSION_ID,
      new InMemoryApplicationRepository(),
      new InMemoryJobDescriptionRepository(),
    );

    expect(csv).toBe(CSV_HEADER);
  });

  it("no incluye Applications de otra sesión en el CSV", async () => {
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const jobDescription = await createTestJobDescription(jobDescriptionRepository);
    const applicationRepository = new InMemoryApplicationRepository();
    await createApplication(
      { jobDescriptionId: jobDescription.id },
      TEST_SESSION_ID,
      applicationRepository,
      jobDescriptionRepository,
      new InMemorySavedCVRepository(),
    );

    const csv = await listApplicationsAsCsv(OTHER_TEST_SESSION_ID, applicationRepository, jobDescriptionRepository);

    expect(csv).toBe(CSV_HEADER);
  });
});
