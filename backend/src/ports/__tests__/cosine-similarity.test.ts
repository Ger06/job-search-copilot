import { describe, expect, it } from "vitest";
import { cosineSimilarity } from "../cosine-similarity.js";

describe("cosineSimilarity", () => {
  it("devuelve 1 para dos vectores idénticos", () => {
    const result = cosineSimilarity([1, 2, 3], [1, 2, 3]);

    expect(result).toBeCloseTo(1);
  });

  it("devuelve 0 para dos vectores ortogonales", () => {
    const result = cosineSimilarity([1, 0], [0, 1]);

    expect(result).toBeCloseTo(0);
  });

  it("devuelve -1 para dos vectores opuestos", () => {
    const result = cosineSimilarity([1, 0], [-1, 0]);

    expect(result).toBeCloseTo(-1);
  });
});
