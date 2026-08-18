import { randomUUID } from "node:crypto";
import type { Bullet } from "./bullet.js";
import type { BulletRepository } from "./bullet-repository.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import { NotFoundError } from "../errors/not-found-error.js";

export function createBullet(
  input: { text: string; workExperienceId: string },
  repository: BulletRepository,
  workExperienceRepository: WorkExperienceRepository,
): Bullet {
  if (workExperienceRepository.findById(input.workExperienceId) === undefined) {
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

export function findBulletById(id: string, repository: BulletRepository): Bullet | undefined {
  return repository.findById(id);
}

export function listBullets(repository: BulletRepository): Bullet[] {
  return repository.list();
}
