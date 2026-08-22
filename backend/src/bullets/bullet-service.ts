import { randomUUID } from "node:crypto";
import type { Bullet } from "./bullet.js";
import type { BulletRepository } from "./bullet-repository.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import { cosineSimilarity } from "../ports/cosine-similarity.js";
import { NotFoundError } from "../errors/not-found-error.js";

export async function createBullet(
  input: { text: string; workExperienceId: string },
  sessionId: string,
  repository: BulletRepository,
  workExperienceRepository: WorkExperienceRepository,
  embeddingProvider: EmbeddingProvider,
): Promise<Bullet> {
  if ((await workExperienceRepository.findById(input.workExperienceId, sessionId)) === undefined) {
    throw new NotFoundError("WorkExperience", input.workExperienceId);
  }

  const embedding = await embeddingProvider.embed(input.text);

  const bullet: Bullet = {
    id: randomUUID(),
    text: input.text,
    workExperienceId: input.workExperienceId,
    embedding,
    createdAt: new Date(),
  };

  return repository.create(bullet, sessionId);
}

export async function findBulletById(
  id: string,
  sessionId: string,
  repository: BulletRepository,
): Promise<Bullet | undefined> {
  return repository.findById(id, sessionId);
}

export async function listBullets(sessionId: string, repository: BulletRepository): Promise<Bullet[]> {
  return repository.list(sessionId);
}

export async function findBulletsByWorkExperienceId(
  workExperienceId: string,
  sessionId: string,
  repository: BulletRepository,
): Promise<Bullet[]> {
  return repository.findByWorkExperienceId(workExperienceId, sessionId);
}

export async function findRelevantBullets(
  jobDescriptionText: string,
  workExperienceId: string,
  sessionId: string,
  repository: BulletRepository,
  embeddingProvider: EmbeddingProvider,
): Promise<Bullet[]> {
  const bullets = await findBulletsByWorkExperienceId(workExperienceId, sessionId, repository);
  const jobDescriptionEmbedding = await embeddingProvider.embed(jobDescriptionText);

  return [...bullets].sort(
    (a, b) =>
      cosineSimilarity(jobDescriptionEmbedding, b.embedding) -
      cosineSimilarity(jobDescriptionEmbedding, a.embedding),
  );
}
