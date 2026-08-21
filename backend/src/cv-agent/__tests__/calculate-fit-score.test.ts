import { describe, expect, it } from "vitest";
import { calculateFitScore } from "../calculate-fit-score.js";
import type { Bullet } from "../../bullets/bullet.js";

function createTestBullet(overrides: Partial<Bullet> = {}): Bullet {
  return {
    id: "bullet-1",
    text: "Reduje el tiempo de build en 40%",
    workExperienceId: "we-1",
    embedding: [1, 0],
    createdAt: new Date(),
    ...overrides,
  };
}

describe("calculateFitScore", () => {
  it("devuelve el promedio de similitud coseno entre el embedding de la vacante y cada bullet dado", () => {
    const jobDescriptionEmbedding = [1, 0];
    const bullets = [
      createTestBullet({ id: "bullet-1", embedding: [1, 0] }), // similitud 1
      createTestBullet({ id: "bullet-2", embedding: [0, 1] }), // similitud 0
    ];

    const fitScore = calculateFitScore(jobDescriptionEmbedding, bullets);

    expect(fitScore).toBeCloseTo(0.5);
  });

  it("dedupea bullets repetidos (mismo id) antes de promediar", () => {
    const jobDescriptionEmbedding = [1, 0];
    const bullets = [
      createTestBullet({ id: "bullet-1", embedding: [1, 0] }),
      createTestBullet({ id: "bullet-1", embedding: [1, 0] }),
      createTestBullet({ id: "bullet-2", embedding: [0, 1] }),
    ];

    const fitScore = calculateFitScore(jobDescriptionEmbedding, bullets);

    expect(fitScore).toBeCloseTo(0.5);
  });

  it("devuelve null si la lista de bullets está vacía", () => {
    const fitScore = calculateFitScore([1, 0], []);

    expect(fitScore).toBeNull();
  });
});
