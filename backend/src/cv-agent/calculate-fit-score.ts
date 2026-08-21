import { cosineSimilarity } from "../ports/cosine-similarity.js";
import type { Bullet } from "../bullets/bullet.js";

export function calculateFitScore(jobDescriptionEmbedding: number[], bullets: Bullet[]): number | null {
  const uniqueBullets = [...new Map(bullets.map((bullet) => [bullet.id, bullet])).values()];

  if (uniqueBullets.length === 0) {
    return null;
  }

  const similarities = uniqueBullets.map((bullet) => cosineSimilarity(jobDescriptionEmbedding, bullet.embedding));
  return similarities.reduce((sum, similarity) => sum + similarity, 0) / similarities.length;
}
