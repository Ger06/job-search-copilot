import { randomUUID } from "node:crypto";
import type { Application, ApplicationStatus } from "./application.js";
import type { ApplicationRepository } from "./application-repository.js";
import type { JobDescriptionRepository } from "../job-descriptions/job-description-repository.js";
import type { SavedCVRepository } from "../saved-cvs/saved-cv-repository.js";
import { NotFoundError } from "../errors/not-found-error.js";

export async function createApplication(
  input: { jobDescriptionId: string; savedCvId?: string | null },
  sessionId: string,
  repository: ApplicationRepository,
  jobDescriptionRepository: JobDescriptionRepository,
  savedCVRepository: SavedCVRepository,
): Promise<Application> {
  if ((await jobDescriptionRepository.findById(input.jobDescriptionId, sessionId)) === undefined) {
    throw new NotFoundError("JobDescription", input.jobDescriptionId);
  }

  if (input.savedCvId != null && (await savedCVRepository.findById(input.savedCvId, sessionId)) === undefined) {
    throw new NotFoundError("SavedCV", input.savedCvId);
  }

  const now = new Date();
  const application: Application = {
    id: randomUUID(),
    jobDescriptionId: input.jobDescriptionId,
    savedCvId: input.savedCvId ?? null,
    status: "pendiente",
    recruiter: null,
    portal: null,
    salaryRequested: null,
    fitScore: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };

  return repository.create(application, sessionId);
}

async function findApplicationOrThrow(id: string, sessionId: string, repository: ApplicationRepository): Promise<Application> {
  const application = await repository.findById(id, sessionId);
  if (application === undefined) {
    throw new NotFoundError("Application", id);
  }
  return application;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  sessionId: string,
  repository: ApplicationRepository,
): Promise<Application> {
  const application = await findApplicationOrThrow(id, sessionId, repository);
  return repository.update({ ...application, status, updatedAt: new Date() }, sessionId);
}

export async function updateApplicationDetails(
  id: string,
  changes: { recruiter?: string | null; portal?: string | null; salaryRequested?: string | null; notes?: string | null },
  sessionId: string,
  repository: ApplicationRepository,
): Promise<Application> {
  const application = await findApplicationOrThrow(id, sessionId, repository);
  return repository.update(
    {
      ...application,
      ...("recruiter" in changes ? { recruiter: changes.recruiter } : {}),
      ...("portal" in changes ? { portal: changes.portal } : {}),
      ...("salaryRequested" in changes ? { salaryRequested: changes.salaryRequested } : {}),
      ...("notes" in changes ? { notes: changes.notes } : {}),
      updatedAt: new Date(),
    },
    sessionId,
  );
}

// No re-valida que savedCvId pertenezca a la misma sesión: el único
// caller (generateSavedCVForApplication) ya construye el SavedCV con el
// mismo sessionId de punta a punta, así que la pertenencia está
// garantizada por construcción, no por un chequeo repetido acá.
export async function linkSavedCVToApplication(
  id: string,
  savedCvId: string,
  fitScore: number | null,
  sessionId: string,
  repository: ApplicationRepository,
): Promise<Application> {
  const application = await findApplicationOrThrow(id, sessionId, repository);
  return repository.update({ ...application, savedCvId, fitScore, updatedAt: new Date() }, sessionId);
}

export async function listApplications(sessionId: string, repository: ApplicationRepository): Promise<Application[]> {
  return repository.list(sessionId);
}

const CSV_HEADER = "id,company,role,status,recruiter,portal,salaryRequested,fitScore,notes,savedCvId,createdAt,updatedAt";

function csvField(value: string | number | null): string {
  if (value === null) {
    return "";
  }
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function listApplicationsAsCsv(
  sessionId: string,
  repository: ApplicationRepository,
  jobDescriptionRepository: JobDescriptionRepository,
): Promise<string> {
  const applications = await repository.list(sessionId);
  const rows = await Promise.all(
    applications.map(async (application) => {
      // Toda Application listada en esta sesión fue creada validando que su
      // jobDescriptionId perteneciera a la misma sesión (ver createApplication),
      // y session_id es inmutable — así que este findById debería resolver
      // siempre. Si no resuelve, es una violación de esa invariante en algún
      // otro lado del código, no un 404 legítimo — por eso 500 y no NotFoundError.
      const jobDescription = await jobDescriptionRepository.findById(application.jobDescriptionId, sessionId);
      if (!jobDescription) {
        throw new Error(
          `Invariante violada: Application ${application.id} referencia una JobDescription (${application.jobDescriptionId}) que no existe en su propia sesión`,
        );
      }
      return [
        csvField(application.id),
        csvField(jobDescription.company),
        csvField(jobDescription.role),
        csvField(application.status),
        csvField(application.recruiter),
        csvField(application.portal),
        csvField(application.salaryRequested),
        csvField(application.fitScore),
        csvField(application.notes),
        csvField(application.savedCvId),
        csvField(application.createdAt.toISOString()),
        csvField(application.updatedAt.toISOString()),
      ].join(",");
    }),
  );

  return [CSV_HEADER, ...rows].join("\n");
}
