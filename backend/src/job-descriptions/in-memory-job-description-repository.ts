import type { JobDescription } from "./job-description.js";
import type { JobDescriptionRepository } from "./job-description-repository.js";

export class InMemoryJobDescriptionRepository implements JobDescriptionRepository {
  private readonly jobDescriptions = new Map<string, JobDescription>();

  create(jobDescription: JobDescription): JobDescription {
    this.jobDescriptions.set(jobDescription.id, jobDescription);
    return jobDescription;
  }

  findById(id: string): JobDescription | undefined {
    return this.jobDescriptions.get(id);
  }

  list(): JobDescription[] {
    return Array.from(this.jobDescriptions.values());
  }

  findByCompanyAndRole(company: string, role: string): JobDescription | undefined {
    const normalizedCompany = company.trim().toLowerCase();
    const normalizedRole = role.trim().toLowerCase();

    return this.list().find(
      (jd) =>
        jd.company.trim().toLowerCase() === normalizedCompany &&
        jd.role.trim().toLowerCase() === normalizedRole,
    );
  }
}
