import { Router } from "express";
import type { WorkExperienceRepository } from "./work-experience-repository.js";
import { createWorkExperience, listWorkExperiences } from "./work-experience-service.js";
import { optionalNullableDate, requireDate, requireNumber, requireString } from "../http/validation.js";

export function createWorkExperienceRouter(deps: { workExperienceRepository: WorkExperienceRepository }): Router {
  const router = Router();

  router.post("/work-experiences", async (req, res, next) => {
    try {
      const company = requireString(req.body, "company");
      const role = requireString(req.body, "role");
      const startDate = requireDate(req.body, "startDate");
      const endDate = optionalNullableDate(req.body, "endDate");
      const order = requireNumber(req.body, "order");

      const workExperience = await createWorkExperience(
        { company, role, startDate, ...(endDate !== undefined ? { endDate } : {}), order },
        req.sessionId,
        deps.workExperienceRepository,
      );

      res.status(201).json(workExperience);
    } catch (error) {
      next(error);
    }
  });

  router.get("/work-experiences", async (req, res, next) => {
    try {
      const workExperiences = await listWorkExperiences(req.sessionId, deps.workExperienceRepository);
      res.status(200).json(workExperiences);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
