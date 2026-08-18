import type { SavedCV } from "./saved-cv.js";

export interface SavedCVRepository {
  create(savedCV: SavedCV): Promise<SavedCV>;
  findById(id: string): Promise<SavedCV | undefined>;
  list(): Promise<SavedCV[]>;
}
