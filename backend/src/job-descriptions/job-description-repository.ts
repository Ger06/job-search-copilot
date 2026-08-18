import type { JobDescription } from "./job-description.js";

export interface JobDescriptionRepository {
  create(jobDescription: JobDescription): JobDescription;
  findById(id: string): JobDescription | undefined;
  list(): JobDescription[];
  findByCompanyAndRole(company: string, role: string): JobDescription | undefined;
}
