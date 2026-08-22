import type { SavedCV } from "./saved-cv.js";

export interface SavedCVRepository {
  create(savedCV: SavedCV, sessionId: string): Promise<SavedCV>;
  findById(id: string, sessionId: string): Promise<SavedCV | undefined>;
  list(sessionId: string): Promise<SavedCV[]>;
}
