import { describe, expect, it } from "vitest";
import { LocalEmbeddingProvider } from "../local-embedding-provider.js";
import { cosineSimilarity } from "../cosine-similarity.js";

describe("LocalEmbeddingProvider (integración)", () => {
  it("da una similitud coseno alta para dos textos similares", async () => {
    const provider = new LocalEmbeddingProvider();

    const a = await provider.embed("Reduje el tiempo de build en 40% optimizando el pipeline de CI");
    const b = await provider.embed("Optimicé el pipeline de CI y bajé el tiempo de build a la mitad");

    expect(cosineSimilarity(a, b)).toBeGreaterThan(0.6);
  });

  it("da una similitud coseno baja para dos textos muy distintos", async () => {
    const provider = new LocalEmbeddingProvider();

    const a = await provider.embed("Reduje el tiempo de build en 40% optimizando el pipeline de CI");
    const b = await provider.embed("Cortar la cebolla en cubos pequeños y dorarla en manteca");

    expect(cosineSimilarity(a, b)).toBeLessThan(0.3);
  });
});
