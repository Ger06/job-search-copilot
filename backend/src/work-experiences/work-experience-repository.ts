import type { WorkExperience } from "./work-experience.js";

export interface WorkExperienceRepository {
  create(workExperience: WorkExperience, sessionId: string): Promise<WorkExperience>;
  findById(id: string, sessionId: string): Promise<WorkExperience | undefined>;
  list(sessionId: string): Promise<WorkExperience[]>;
}
