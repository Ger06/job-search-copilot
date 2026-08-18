import type { Bullet } from "./bullet.js";

export interface BulletRepository {
  create(bullet: Bullet): Promise<Bullet>;
  findById(id: string): Promise<Bullet | undefined>;
  list(): Promise<Bullet[]>;
  findByWorkExperienceId(workExperienceId: string): Promise<Bullet[]>;
}
