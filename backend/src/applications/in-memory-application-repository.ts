import type { Application } from "./application.js";
import type { ApplicationRepository } from "./application-repository.js";

export class InMemoryApplicationRepository implements ApplicationRepository {
  private readonly applications = new Map<string, Application>();

  async create(application: Application): Promise<Application> {
    this.applications.set(application.id, application);
    return application;
  }

  async findById(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async list(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }

  async update(application: Application): Promise<Application> {
    this.applications.set(application.id, application);
    return application;
  }
}
