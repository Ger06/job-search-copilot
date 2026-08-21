import { IncompleteCoverageError } from "../errors/incomplete-coverage-error.js";

export function validateAllWorkExperiencesCovered(
  allWorkExperienceIds: string[],
  coveredWorkExperienceIds: string[],
): void {
  const coveredSet = new Set(coveredWorkExperienceIds);
  const missing = allWorkExperienceIds.filter((id) => !coveredSet.has(id));

  if (missing.length > 0) {
    throw new IncompleteCoverageError(missing);
  }
}
