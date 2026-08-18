import { describe, expect, it } from "vitest";
import { DuplicateError } from "../duplicate-error.js";

describe("DuplicateError", () => {
  it("asigna un mensaje que incluye la entidad y los campos/valores duplicados", () => {
    const error = new DuplicateError("JobDescription", {
      company: "Acme Corp",
      role: "Backend Engineer",
    });

    expect(error.message).toBe(
      "JobDescription con company 'Acme Corp' y role 'Backend Engineer' ya existe",
    );
  });
});
