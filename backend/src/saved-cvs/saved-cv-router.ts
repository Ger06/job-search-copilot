import { Router } from "express";
import type { SavedCVRepository } from "./saved-cv-repository.js";
import { findSavedCVById } from "./saved-cv-service.js";
import { NotFoundError } from "../errors/not-found-error.js";

export function createSavedCVRouter(deps: { savedCVRepository: SavedCVRepository }): Router {
  const router = Router();

  router.get("/saved-cvs/:id", async (req, res, next) => {
    try {
      const id = req.params["id"] as string;
      const savedCV = await findSavedCVById(id, req.sessionId, deps.savedCVRepository);
      if (savedCV === undefined) {
        throw new NotFoundError("SavedCV", id);
      }

      res.status(200).json(savedCV);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
