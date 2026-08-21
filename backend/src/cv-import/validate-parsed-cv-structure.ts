import type { CVParseResult } from "./cv-parse-result.js";
import { MalformedCVParseError } from "../errors/malformed-cv-parse-error.js";

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function isInvalidDate(value: string): boolean {
  return Number.isNaN(new Date(value).getTime());
}

export function validateParsedCVStructure(result: CVParseResult): void {
  for (const workExperience of result.workExperiences) {
    if (isBlank(workExperience.company)) {
      throw new MalformedCVParseError("El CV parseado tiene una work experience con company vacío");
    }
    if (isBlank(workExperience.role)) {
      throw new MalformedCVParseError("El CV parseado tiene una work experience con role vacío");
    }
    if (isInvalidDate(workExperience.startDate)) {
      throw new MalformedCVParseError(`El CV parseado tiene un startDate inválido: "${workExperience.startDate}"`);
    }
    if (workExperience.endDate !== null && isInvalidDate(workExperience.endDate)) {
      throw new MalformedCVParseError(`El CV parseado tiene un endDate inválido: "${workExperience.endDate}"`);
    }
    for (const bullet of workExperience.bullets) {
      if (isBlank(bullet.text)) {
        throw new MalformedCVParseError(
          `El CV parseado tiene un bullet vacío en la work experience "${workExperience.company}"`,
        );
      }
    }
  }
}
