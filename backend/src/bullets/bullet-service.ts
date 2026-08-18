import { randomUUID } from "node:crypto";
import type { Bullet } from "./bullet.js";
import type { BulletRepository } from "./bullet-repository.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import { cosineSimilarity } from "../ports/cosine-similarity.js";
import { NotFoundError } from "../errors/not-found-error.js";

export async function createBullet(
  input: { text: string; workExperienceId: string },
  repository: BulletRepository,
  workExperienceRepository: WorkExperienceRepository,
  embeddingProvider: EmbeddingProvider,
): Promise<Bullet> {
  if ((await workExperienceRepository.findById(input.workExperienceId)) === undefined) {
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

  return repository.create(bullet);
}

export async function findBulletById(
  id: string,
  repository: BulletRepository,
): Promise<Bullet | undefined> {
  return repository.findById(id);
}

export async function listBullets(repository: BulletRepository): Promise<Bullet[]> {
  return repository.list();
}

export async function findBulletsByWorkExperienceId(
  workExperienceId: string,
  repository: BulletRepository,
): Promise<Bullet[]> {
  return repository.findByWorkExperienceId(workExperienceId);
}

export async function findRelevantBullets(
  jobDescriptionText: string,
  workExperienceId: string,
  repository: BulletRepository,
  embeddingProvider: EmbeddingProvider,
): Promise<Bullet[]> {
  const bullets = await findBulletsByWorkExperienceId(workExperienceId, repository);
  const jobDescriptionEmbedding = await embeddingProvider.embed(jobDescriptionText);

  return [...bullets].sort(
    (a, b) =>
      cosineSimilarity(jobDescriptionEmbedding, b.embedding) -
      cosineSimilarity(jobDescriptionEmbedding, a.embedding),
  );
}
