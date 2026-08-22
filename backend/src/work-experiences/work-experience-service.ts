import { randomUUID } from "node:crypto";
import type { WorkExperience } from "./work-experience.js";
import type { WorkExperienceRepository } from "./work-experience-repository.js";

export async function createWorkExperience(
  input: {
    company: string;
    role: string;
    startDate: Date;
    endDate?: Date;
    order: number;
  },
  sessionId: string,
  repository: WorkExperienceRepository,
): Promise<WorkExperience> {
  const workExperience: WorkExperience = {
    id: randomUUID(),
    company: input.company,
    role: input.role,
    startDate: input.startDate,
    ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
    order: input.order,
  };

  return repository.create(workExperience, sessionId);
}

export async function findWorkExperienceById(
  id: string,
  sessionId: string,
  repository: WorkExperienceRepository,
): Promise<WorkExperience | undefined> {
  return repository.findById(id, sessionId);
}

// Cuando se genere un CV, deben aparecer TODAS las WorkExperience del
// historial, nunca menos — esto va a ser un hook más adelante sobre este
// listado.
export async function listWorkExperiences(
  sessionId: string,
  repository: WorkExperienceRepository,
): Promise<WorkExperience[]> {
  return repository.list(sessionId);
}
