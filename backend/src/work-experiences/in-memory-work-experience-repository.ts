import type { WorkExperience } from "./work-experience.js";
import type { WorkExperienceRepository } from "./work-experience-repository.js";

export class InMemoryWorkExperienceRepository implements WorkExperienceRepository {
  private readonly workExperiences = new Map<string, WorkExperience>();

  async create(workExperience: WorkExperience): Promise<WorkExperience> {
    this.workExperiences.set(workExperience.id, workExperience);
    return workExperience;
  }

  async findById(id: string): Promise<WorkExperience | undefined> {
    return this.workExperiences.get(id);
  }

  async list(): Promise<WorkExperience[]> {
    return Array.from(this.workExperiences.values());
  }
}
