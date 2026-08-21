export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function requireObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("El body debe ser un objeto JSON");
  }
  return body as Record<string, unknown>;
}

export function requireString(body: unknown, field: string): string {
  const value = requireObject(body)[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} es requerido y debe ser un string no vacío`);
  }
  return value;
}

export function requireNumber(body: unknown, field: string): number {
  const value = requireObject(body)[field];
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ValidationError(`${field} es requerido y debe ser un número`);
  }
  return value;
}

export function requireDate(body: unknown, field: string): Date {
  const value = requireString(body, field);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${field} debe ser una fecha válida`);
  }
  return date;
}

export function optionalNullableDate(body: unknown, field: string): Date | undefined {
  const value = requireObject(body)[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new ValidationError(`${field} debe ser un string de fecha o null`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${field} debe ser una fecha válida`);
  }
  return date;
}

export function requireNullableString(body: unknown, field: string): string | null {
  const value = requireObject(body)[field];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new ValidationError(`${field} debe ser un string o null`);
  }
  return value;
}
