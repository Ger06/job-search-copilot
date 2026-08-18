import { randomUUID } from "node:crypto";
import type { WorkExperience } from "./work-experience.js";
import type { WorkExperienceRepository } from "./work-experience-repository.js";

export function createWorkExperience(
  input: {
    company: string;
    role: string;
    startDate: Date;
    endDate?: Date;
    order: number;
  },
  repository: WorkExperienceRepository,
): WorkExperience {
  const workExperience: WorkExperience = {
    id: randomUUID(),
    company: input.company,
    role: input.role,
    startDate: input.startDate,
    ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
    order: input.order,
  };

  return repository.create(workExperience);
}

export function findWorkExperienceById(
  id: string,
  repository: WorkExperienceRepository,
): WorkExperience | undefined {
  return repository.findById(id);
}

// Cuando se genere un CV, deben aparecer TODAS las WorkExperience del
// historial, nunca menos — esto va a ser un hook más adelante sobre este
// listado.
export function listWorkExperiences(repository: WorkExperienceRepository): WorkExperience[] {
  return repository.list();
}
