import { Router } from "express";
import type { JobDescriptionRepository } from "./job-description-repository.js";
import { createJobDescription, listJobDescriptions } from "./job-description-service.js";
import { requireString } from "../http/validation.js";

export function createJobDescriptionRouter(deps: { jobDescriptionRepository: JobDescriptionRepository }): Router {
  const router = Router();

  router.post("/job-descriptions", async (req, res, next) => {
    try {
      const company = requireString(req.body, "company");
      const role = requireString(req.body, "role");
      const rawText = requireString(req.body, "rawText");

      const jobDescription = await createJobDescription(
        { company, role, rawText },
        req.sessionId,
        deps.jobDescriptionRepository,
      );

      res.status(201).json(jobDescription);
    } catch (error) {
      next(error);
    }
  });

  router.get("/job-descriptions", async (req, res, next) => {
    try {
      const jobDescriptions = await listJobDescriptions(req.sessionId, deps.jobDescriptionRepository);
      res.status(200).json(jobDescriptions);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
