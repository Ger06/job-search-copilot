import { describe, expect, it } from "vitest";
import {
  optionalNullableDate,
  requireDate,
  requireNullableString,
  requireNumber,
  requireObject,
  requireString,
  ValidationError,
} from "../validation.js";

describe("requireObject", () => {
  it("devuelve el body si es un objeto", () => {
    expect(requireObject({ a: 1 })).toEqual({ a: 1 });
  });

  it("lanza ValidationError si el body no es un objeto (ej. un array o null)", () => {
    expect(() => requireObject(null)).toThrow(ValidationError);
    expect(() => requireObject([1, 2])).toThrow(ValidationError);
    expect(() => requireObject("texto")).toThrow(ValidationError);
  });
});

describe("requireString", () => {
  it("devuelve el string si el campo está presente y no vacío", () => {
    expect(requireString({ company: "Acme" }, "company")).toBe("Acme");
  });

  it("lanza ValidationError si el campo falta", () => {
    expect(() => requireString({}, "company")).toThrow(ValidationError);
  });

  it("lanza ValidationError si el campo es un string vacío o blanco", () => {
    expect(() => requireString({ company: "   " }, "company")).toThrow(ValidationError);
  });

  it("lanza ValidationError si el campo no es un string", () => {
    expect(() => requireString({ company: 123 }, "company")).toThrow(ValidationError);
  });
});

describe("requireNumber", () => {
  it("devuelve el número si el campo es válido", () => {
    expect(requireNumber({ order: 1 }, "order")).toBe(1);
  });

  it("lanza ValidationError si el campo no es un número", () => {
    expect(() => requireNumber({ order: "1" }, "order")).toThrow(ValidationError);
  });
});

describe("requireDate", () => {
  it("devuelve un Date si el campo es una fecha válida", () => {
    const date = requireDate({ startDate: "2020-01-01" }, "startDate");
    expect(date).toBeInstanceOf(Date);
    expect(Number.isNaN(date.getTime())).toBe(false);
  });

  it("lanza ValidationError si el campo no parsea como fecha", () => {
    expect(() => requireDate({ startDate: "no-es-fecha" }, "startDate")).toThrow(ValidationError);
  });
});

describe("optionalNullableDate", () => {
  it("devuelve undefined si el campo falta", () => {
    expect(optionalNullableDate({}, "endDate")).toBeUndefined();
  });

  it("devuelve undefined si el campo es null", () => {
    expect(optionalNullableDate({ endDate: null }, "endDate")).toBeUndefined();
  });

  it("devuelve un Date si el campo es una fecha válida", () => {
    const date = optionalNullableDate({ endDate: "2022-06-01" }, "endDate");
    expect(date).toBeInstanceOf(Date);
  });

  it("lanza ValidationError si el campo no parsea como fecha", () => {
    expect(() => optionalNullableDate({ endDate: "no-es-fecha" }, "endDate")).toThrow(ValidationError);
  });
});

describe("requireNullableString", () => {
  it("devuelve el string si el campo es un string", () => {
    expect(requireNullableString({ endDate: "2022-06-01" }, "endDate")).toBe("2022-06-01");
  });

  it("devuelve null si el campo es null", () => {
    expect(requireNullableString({ endDate: null }, "endDate")).toBeNull();
  });

  it("lanza ValidationError si el campo no es string ni null", () => {
    expect(() => requireNullableString({ endDate: 123 }, "endDate")).toThrow(ValidationError);
  });
});
