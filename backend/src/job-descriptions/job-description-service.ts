import { randomUUID } from "node:crypto";
import type { JobDescription } from "./job-description.js";
import type { JobDescriptionRepository } from "./job-description-repository.js";
import { DuplicateError } from "../errors/duplicate-error.js";

export function createJobDescription(
  input: {
    company: string;
    role: string;
    rawText: string;
  },
  repository: JobDescriptionRepository,
): JobDescription {
  if (repository.findByCompanyAndRole(input.company, input.role) !== undefined) {
    throw new DuplicateError("JobDescription", { company: input.company, role: input.role });
  }

  const jobDescription: JobDescription = {
    id: randomUUID(),
    company: input.company,
    role: input.role,
    rawText: input.rawText,
    createdAt: new Date(),
  };

  return repository.create(jobDescription);
}

export function findJobDescriptionById(
  id: string,
  repository: JobDescriptionRepository,
): JobDescription | undefined {
  return repository.findById(id);
}

export function listJobDescriptions(repository: JobDescriptionRepository): JobDescription[] {
  return repository.list();
}
