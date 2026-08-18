import type { JobDescription } from "./job-description.js";
import type { JobDescriptionRepository } from "./job-description-repository.js";

export class InMemoryJobDescriptionRepository implements JobDescriptionRepository {
  private readonly jobDescriptions = new Map<string, JobDescription>();

  async create(jobDescription: JobDescription): Promise<JobDescription> {
    this.jobDescriptions.set(jobDescription.id, jobDescription);
    return jobDescription;
  }

  async findById(id: string): Promise<JobDescription | undefined> {
    return this.jobDescriptions.get(id);
  }

  async list(): Promise<JobDescription[]> {
    return Array.from(this.jobDescriptions.values());
  }

  async findByCompanyAndRole(company: string, role: string): Promise<JobDescription | undefined> {
    const normalizedCompany = company.trim().toLowerCase();
    const normalizedRole = role.trim().toLowerCase();

    return (await this.list()).find(
      (jd) =>
        jd.company.trim().toLowerCase() === normalizedCompany &&
        jd.role.trim().toLowerCase() === normalizedRole,
    );
  }
}
