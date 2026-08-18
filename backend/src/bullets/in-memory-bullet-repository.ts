import type { Bullet } from "./bullet.js";
import type { BulletRepository } from "./bullet-repository.js";

export class InMemoryBulletRepository implements BulletRepository {
  private readonly bullets = new Map<string, Bullet>();

  create(bullet: Bullet): Bullet {
    this.bullets.set(bullet.id, bullet);
    return bullet;
  }

  findById(id: string): Bullet | undefined {
    return this.bullets.get(id);
  }

  list(): Bullet[] {
    return Array.from(this.bullets.values());
  }
}
