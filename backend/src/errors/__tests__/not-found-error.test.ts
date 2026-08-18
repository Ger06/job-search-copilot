import { describe, expect, it } from "vitest";
import { NotFoundError } from "../not-found-error.js";

describe("NotFoundError", () => {
  it("asigna un mensaje que incluye la entidad y el id", () => {
    const error = new NotFoundError("WorkExperience", "we-1");

    expect(error.message).toBe("WorkExperience con id we-1 no encontrado");
  });
});
