import { randomUUID } from "node:crypto";
import type { JobDescription } from "./job-description.js";
import type { JobDescriptionRepository } from "./job-description-repository.js";
import { DuplicateError } from "../errors/duplicate-error.js";

export async function createJobDescription(
  input: {
    company: string;
    role: string;
    rawText: string;
  },
  repository: JobDescriptionRepository,
): Promise<JobDescription> {
  if ((await repository.findByCompanyAndRole(input.company, input.role)) !== undefined) {
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

export async function findJobDescriptionById(
  id: string,
  repository: JobDescriptionRepository,
): Promise<JobDescription | undefined> {
  return repository.findById(id);
}

export async function listJobDescriptions(
  repository: JobDescriptionRepository,
): Promise<JobDescription[]> {
  return repository.list();
}
