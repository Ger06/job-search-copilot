import type { SavedCV } from "./saved-cv.js";
import type { SavedCVRepository } from "./saved-cv-repository.js";

export class InMemorySavedCVRepository implements SavedCVRepository {
  private readonly savedCVs = new Map<string, { sessionId: string; entity: SavedCV }>();

  async create(savedCV: SavedCV, sessionId: string): Promise<SavedCV> {
    this.savedCVs.set(savedCV.id, { sessionId, entity: savedCV });
    return savedCV;
  }

  async findById(id: string, sessionId: string): Promise<SavedCV | undefined> {
    const record = this.savedCVs.get(id);
    return record?.sessionId === sessionId ? record.entity : undefined;
  }

  async list(sessionId: string): Promise<SavedCV[]> {
    return Array.from(this.savedCVs.values())
      .filter((record) => record.sessionId === sessionId)
      .map((record) => record.entity);
  }
}
