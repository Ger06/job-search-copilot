import { describe, expect, it } from "vitest";
import { getFitScoreLabel } from "../fit-score";

describe("getFitScoreLabel", () => {
  it("devuelve null si fitScore es null (CV todavía no generado)", () => {
    expect(getFitScoreLabel(null)).toBeNull();
  });

  it("devuelve 'Bajo' para valores menores a 0.25", () => {
    expect(getFitScoreLabel(0)).toBe("Bajo");
    expect(getFitScoreLabel(0.1)).toBe("Bajo");
    expect(getFitScoreLabel(0.24)).toBe("Bajo");
  });

  it("devuelve 'Medio' para valores entre 0.25 y 0.45 (inclusive)", () => {
    expect(getFitScoreLabel(0.25)).toBe("Medio");
    expect(getFitScoreLabel(0.35)).toBe("Medio");
    expect(getFitScoreLabel(0.45)).toBe("Medio");
  });

  it("devuelve 'Alto' para valores mayores a 0.45", () => {
    expect(getFitScoreLabel(0.46)).toBe("Alto");
    expect(getFitScoreLabel(0.9)).toBe("Alto");
    expect(getFitScoreLabel(1)).toBe("Alto");
  });
});
