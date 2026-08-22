import type { Application } from "./application.js";
import type { ApplicationRepository } from "./application-repository.js";
import { NotFoundError } from "../errors/not-found-error.js";

export class InMemoryApplicationRepository implements ApplicationRepository {
  private readonly applications = new Map<string, { sessionId: string; entity: Application }>();

  async create(application: Application, sessionId: string): Promise<Application> {
    this.applications.set(application.id, { sessionId, entity: application });
    return application;
  }

  async findById(id: string, sessionId: string): Promise<Application | undefined> {
    const record = this.applications.get(id);
    return record?.sessionId === sessionId ? record.entity : undefined;
  }

  async list(sessionId: string): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter((record) => record.sessionId === sessionId)
      .map((record) => record.entity);
  }

  // Chequeo defensivo de ownership acá también (no solo confiar en que el
  // caller ya validó vía findById) — ver comentario en
  // ApplicationRepositorySupabase.update sobre por qué.
  async update(application: Application, sessionId: string): Promise<Application> {
    const record = this.applications.get(application.id);
    if (record === undefined || record.sessionId !== sessionId) {
      throw new NotFoundError("Application", application.id);
    }
    this.applications.set(application.id, { sessionId, entity: application });
    return application;
  }
}
