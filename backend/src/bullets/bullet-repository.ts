import type { Bullet } from "./bullet.js";

export interface BulletRepository {
  create(bullet: Bullet): Bullet;
  findById(id: string): Bullet | undefined;
  list(): Bullet[];
}
