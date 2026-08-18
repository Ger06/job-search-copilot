export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valueA = a[i] ?? 0;
    const valueB = b[i] ?? 0;
    dotProduct += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
