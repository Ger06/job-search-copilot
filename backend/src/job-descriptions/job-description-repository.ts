import type { JobDescription } from "./job-description.js";

export interface JobDescriptionRepository {
  create(jobDescription: JobDescription): Promise<JobDescription>;
  findById(id: string): Promise<JobDescription | undefined>;
  list(): Promise<JobDescription[]>;
  findByCompanyAndRole(company: string, role: string): Promise<JobDescription | undefined>;
}
