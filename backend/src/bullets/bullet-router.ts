import { Router } from "express";
import type { BulletRepository } from "./bullet-repository.js";
import { createBullet, listBullets } from "./bullet-service.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import { requireString } from "../http/validation.js";

export function createBulletRouter(deps: {
  bulletRepository: BulletRepository;
  workExperienceRepository: WorkExperienceRepository;
  embeddingProvider: EmbeddingProvider;
}): Router {
  const router = Router();

  router.post("/bullets", async (req, res, next) => {
    try {
      const text = requireString(req.body, "text");
      const workExperienceId = requireString(req.body, "workExperienceId");

      const bullet = await createBullet(
        { text, workExperienceId },
        deps.bulletRepository,
        deps.workExperienceRepository,
        deps.embeddingProvider,
      );

      res.status(201).json(bullet);
    } catch (error) {
      next(error);
    }
  });

  router.get("/bullets", async (_req, res, next) => {
    try {
      const bullets = await listBullets(deps.bulletRepository);
      res.status(200).json(bullets);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
