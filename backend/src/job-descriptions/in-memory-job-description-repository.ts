import type { JobDescription } from "./job-description.js";
import type { JobDescriptionRepository } from "./job-description-repository.js";

export class InMemoryJobDescriptionRepository implements JobDescriptionRepository {
  private readonly jobDescriptions = new Map<string, { sessionId: string; entity: JobDescription }>();

  async create(jobDescription: JobDescription, sessionId: string): Promise<JobDescription> {
    this.jobDescriptions.set(jobDescription.id, { sessionId, entity: jobDescription });
    return jobDescription;
  }

  async findById(id: string, sessionId: string): Promise<JobDescription | undefined> {
    const record = this.jobDescriptions.get(id);
    return record?.sessionId === sessionId ? record.entity : undefined;
  }

  async list(sessionId: string): Promise<JobDescription[]> {
    return Array.from(this.jobDescriptions.values())
      .filter((record) => record.sessionId === sessionId)
      .map((record) => record.entity);
  }

  async findByCompanyAndRole(company: string, role: string, sessionId: string): Promise<JobDescription | undefined> {
    const normalizedCompany = company.trim().toLowerCase();
    const normalizedRole = role.trim().toLowerCase();

    return (await this.list(sessionId)).find(
      (jd) =>
        jd.company.trim().toLowerCase() === normalizedCompany &&
        jd.role.trim().toLowerCase() === normalizedRole,
    );
  }
}
