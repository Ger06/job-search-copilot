export class DuplicateError extends Error {
  constructor(entity: string, fields: Record<string, string>) {
    const description = Object.entries(fields)
      .map(([field, value]) => `${field} '${value}'`)
      .join(" y ");
    super(`${entity} con ${description} ya existe`);
    this.name = "DuplicateError";
  }
}
