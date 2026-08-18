import type { WorkExperience } from "./work-experience.js";

export interface WorkExperienceRepository {
  create(workExperience: WorkExperience): WorkExperience;
  findById(id: string): WorkExperience | undefined;
  list(): WorkExperience[];
}
