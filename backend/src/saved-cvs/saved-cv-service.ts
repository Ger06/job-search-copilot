import { randomUUID } from "node:crypto";
import type { SavedCV } from "./saved-cv.js";
import type { SavedCVRepository } from "./saved-cv-repository.js";
import type { JobDescriptionRepository } from "../job-descriptions/job-description-repository.js";
import { NotFoundError } from "../errors/not-found-error.js";

// El content de un SavedCV puede redactar/mejorar el fraseo de un Bullet
// original, pero nunca puede introducir una métrica o dato que no estuviera
// ya en el Bullet fuente — regla de honestidad no negociable del proyecto.
export async function createSavedCV(
  input: { jobDescriptionId: string; content: string },
  repository: SavedCVRepository,
  jobDescriptionRepository: JobDescriptionRepository,
): Promise<SavedCV> {
  if ((await jobDescriptionRepository.findById(input.jobDescriptionId)) === undefined) {
    throw new NotFoundError("JobDescription", input.jobDescriptionId);
  }

  const savedCV: SavedCV = {
    id: randomUUID(),
    jobDescriptionId: input.jobDescriptionId,
    content: input.content,
    createdAt: new Date(),
  };

  return repository.create(savedCV);
}

export async function findSavedCVById(
  id: string,
  repository: SavedCVRepository,
): Promise<SavedCV | undefined> {
  return repository.findById(id);
}

export async function listSavedCVs(repository: SavedCVRepository): Promise<SavedCV[]> {
  return repository.list();
}
