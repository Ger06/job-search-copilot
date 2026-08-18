import { randomUUID } from "node:crypto";
import type { Bullet } from "./bullet.js";
import type { BulletRepository } from "./bullet-repository.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import { NotFoundError } from "../errors/not-found-error.js";

export async function createBullet(
  input: { text: string; workExperienceId: string },
  repository: BulletRepository,
  workExperienceRepository: WorkExperienceRepository,
): Promise<Bullet> {
  if ((await workExperienceRepository.findById(input.workExperienceId)) === undefined) {
    throw new NotFoundError("WorkExperience", input.workExperienceId);
  }

  const bullet: Bullet = {
    id: randomUUID(),
    text: input.text,
    workExperienceId: input.workExperienceId,
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
