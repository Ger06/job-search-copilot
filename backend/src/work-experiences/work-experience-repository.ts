import type { WorkExperience } from "./work-experience.js";

export interface WorkExperienceRepository {
  create(workExperience: WorkExperience): Promise<WorkExperience>;
  findById(id: string): Promise<WorkExperience | undefined>;
  list(): Promise<WorkExperience[]>;
}
