import type { Bullet } from "./bullet.js";
import type { BulletRepository } from "./bullet-repository.js";

export class InMemoryBulletRepository implements BulletRepository {
  private readonly bullets = new Map<string, Bullet>();

  async create(bullet: Bullet): Promise<Bullet> {
    this.bullets.set(bullet.id, bullet);
    return bullet;
  }

  async findById(id: string): Promise<Bullet | undefined> {
    return this.bullets.get(id);
  }

  async list(): Promise<Bullet[]> {
    return Array.from(this.bullets.values());
  }

  async findByWorkExperienceId(workExperienceId: string): Promise<Bullet[]> {
    return (await this.list()).filter((bullet) => bullet.workExperienceId === workExperienceId);
  }
}
