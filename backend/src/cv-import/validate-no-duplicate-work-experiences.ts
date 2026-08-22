import type { CVParseResult } from "./cv-parse-result.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import { DuplicateError } from "../errors/duplicate-error.js";

export async function validateNoDuplicateWorkExperiences(
  draft: CVParseResult,
  sessionId: string,
  repository: WorkExperienceRepository,
): Promise<void> {
  const existing = await repository.list(sessionId);

  for (const draftWorkExperience of draft.workExperiences) {
    const normalizedCompany = draftWorkExperience.company.trim().toLowerCase();
    const normalizedRole = draftWorkExperience.role.trim().toLowerCase();

    const duplicate = existing.find(
      (workExperience) =>
        workExperience.company.trim().toLowerCase() === normalizedCompany &&
        workExperience.role.trim().toLowerCase() === normalizedRole &&
        workExperience.startDate.toISOString().slice(0, 10) === draftWorkExperience.startDate,
    );

    if (duplicate) {
      throw new DuplicateError("WorkExperience", {
        company: draftWorkExperience.company,
        role: draftWorkExperience.role,
        startDate: draftWorkExperience.startDate,
      });
    }
  }
}
