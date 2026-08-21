export class IncompleteCoverageError extends Error {
  constructor(missingWorkExperienceIds: string[]) {
    super(`Cobertura incompleta: faltan work experiences sin cubrir: ${missingWorkExperienceIds.join(", ")}`);
    this.name = "IncompleteCoverageError";
  }
}
