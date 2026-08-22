import type { Application } from "./application.js";

export interface ApplicationRepository {
  create(application: Application, sessionId: string): Promise<Application>;
  findById(id: string, sessionId: string): Promise<Application | undefined>;
  list(sessionId: string): Promise<Application[]>;
  update(application: Application, sessionId: string): Promise<Application>;
}
