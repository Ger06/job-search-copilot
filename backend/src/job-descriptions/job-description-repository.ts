import type { JobDescription } from "./job-description.js";

export interface JobDescriptionRepository {
  create(jobDescription: JobDescription, sessionId: string): Promise<JobDescription>;
  findById(id: string, sessionId: string): Promise<JobDescription | undefined>;
  list(sessionId: string): Promise<JobDescription[]>;
  findByCompanyAndRole(company: string, role: string, sessionId: string): Promise<JobDescription | undefined>;
}
