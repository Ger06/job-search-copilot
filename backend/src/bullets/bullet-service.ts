import { randomUUID } from "node:crypto";
import type { Bullet } from "./bullet.js";

export function createBullet(input: { text: string; workExperienceId: string }): Bullet {
  return {
    id: randomUUID(),
    text: input.text,
    workExperienceId: input.workExperienceId,
    createdAt: new Date(),
  };
}
