import type { Bullet } from "./bullet.js";

export interface BulletRepository {
  create(bullet: Bullet, sessionId: string): Promise<Bullet>;
  findById(id: string, sessionId: string): Promise<Bullet | undefined>;
  list(sessionId: string): Promise<Bullet[]>;
  findByWorkExperienceId(workExperienceId: string, sessionId: string): Promise<Bullet[]>;
}
