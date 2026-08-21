import type { Application } from "./application.js";

export interface ApplicationRepository {
  create(application: Application): Promise<Application>;
  findById(id: string): Promise<Application | undefined>;
  list(): Promise<Application[]>;
  update(application: Application): Promise<Application>;
}
