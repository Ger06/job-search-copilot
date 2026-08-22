import type { WorkExperience } from "./work-experience.js";
import type { WorkExperienceRepository } from "./work-experience-repository.js";

export class InMemoryWorkExperienceRepository implements WorkExperienceRepository {
  private readonly workExperiences = new Map<string, { sessionId: string; entity: WorkExperience }>();

  async create(workExperience: WorkExperience, sessionId: string): Promise<WorkExperience> {
    this.workExperiences.set(workExperience.id, { sessionId, entity: workExperience });
    return workExperience;
  }

  async findById(id: string, sessionId: string): Promise<WorkExperience | undefined> {
    const record = this.workExperiences.get(id);
    return record?.sessionId === sessionId ? record.entity : undefined;
  }

  async list(sessionId: string): Promise<WorkExperience[]> {
    return Array.from(this.workExperiences.values())
      .filter((record) => record.sessionId === sessionId)
      .map((record) => record.entity);
  }
}
