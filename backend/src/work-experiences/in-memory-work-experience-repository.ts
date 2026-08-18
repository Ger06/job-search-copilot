import type { WorkExperience } from "./work-experience.js";
import type { WorkExperienceRepository } from "./work-experience-repository.js";

export class InMemoryWorkExperienceRepository implements WorkExperienceRepository {
  private readonly workExperiences = new Map<string, WorkExperience>();

  create(workExperience: WorkExperience): WorkExperience {
    this.workExperiences.set(workExperience.id, workExperience);
    return workExperience;
  }

  findById(id: string): WorkExperience | undefined {
    return this.workExperiences.get(id);
  }

  list(): WorkExperience[] {
    return Array.from(this.workExperiences.values());
  }
}
