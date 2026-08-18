import type { SavedCV } from "./saved-cv.js";
import type { SavedCVRepository } from "./saved-cv-repository.js";

export class InMemorySavedCVRepository implements SavedCVRepository {
  private readonly savedCVs = new Map<string, SavedCV>();

  async create(savedCV: SavedCV): Promise<SavedCV> {
    this.savedCVs.set(savedCV.id, savedCV);
    return savedCV;
  }

  async findById(id: string): Promise<SavedCV | undefined> {
    return this.savedCVs.get(id);
  }

  async list(): Promise<SavedCV[]> {
    return Array.from(this.savedCVs.values());
  }
}
