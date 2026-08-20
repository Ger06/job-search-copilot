import { FabricatedContentError } from "../errors/fabricated-content-error.js";

const EMAIL_PATTERN = /\S+@\S+\.\S+/;
const PHONE_PATTERN = /\d(?:[\s\-().]*\d){6,}/;

// TODO: universidad/educación inventada queda fuera de alcance por ahora —
// una regex confiable sin falsos positivos con nombres de empresas reales
// no es viable sin una lista de instituciones o NLP.
export function validateNoFabricatedContactInfo(content: string): void {
  if (EMAIL_PATTERN.test(content)) {
    throw new FabricatedContentError("email");
  }
  if (PHONE_PATTERN.test(content)) {
    throw new FabricatedContentError("teléfono");
  }
}
