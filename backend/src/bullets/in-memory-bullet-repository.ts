import type { Bullet } from "./bullet.js";
import type { BulletRepository } from "./bullet-repository.js";

export class InMemoryBulletRepository implements BulletRepository {
  private readonly bullets = new Map<string, { sessionId: string; entity: Bullet }>();

  async create(bullet: Bullet, sessionId: string): Promise<Bullet> {
    this.bullets.set(bullet.id, { sessionId, entity: bullet });
    return bullet;
  }

  async findById(id: string, sessionId: string): Promise<Bullet | undefined> {
    const record = this.bullets.get(id);
    return record?.sessionId === sessionId ? record.entity : undefined;
  }

  async list(sessionId: string): Promise<Bullet[]> {
    return Array.from(this.bullets.values())
      .filter((record) => record.sessionId === sessionId)
      .map((record) => record.entity);
  }

  async findByWorkExperienceId(workExperienceId: string, sessionId: string): Promise<Bullet[]> {
    return (await this.list(sessionId)).filter((bullet) => bullet.workExperienceId === workExperienceId);
  }
}
