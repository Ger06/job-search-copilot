import { describe, expect, it } from "vitest";
import { createWorkExperience } from "../work-experience-service.js";

describe("createWorkExperience", () => {
  it("crea un work experience con la company dada", () => {
    const workExperience = createWorkExperience({ company: "Acme Corp" });

    expect(workExperience.company).toBe("Acme Corp");
  });
});
