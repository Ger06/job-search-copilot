import { Router } from "express";
import type { ApplicationRepository } from "./application-repository.js";
import { APPLICATION_STATUSES, type ApplicationStatus } from "./application.js";
import {
  createApplication,
  listApplications,
  listApplicationsAsCsv,
  updateApplicationDetails,
  updateApplicationStatus,
} from "./application-service.js";
import { generateSavedCVForApplication } from "./generate-saved-cv-for-application.js";
import type { JobDescriptionRepository } from "../job-descriptions/job-description-repository.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import type { BulletRepository } from "../bullets/bullet-repository.js";
import type { SavedCVRepository } from "../saved-cvs/saved-cv-repository.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { LLMProvider } from "../ports/llm-provider.js";
import { requireObject, requireNullableString, requireString, ValidationError } from "../http/validation.js";

export function createApplicationRouter(deps: {
  applicationRepository: ApplicationRepository;
  jobDescriptionRepository: JobDescriptionRepository;
  workExperienceRepository: WorkExperienceRepository;
  bulletRepository: BulletRepository;
  savedCVRepository: SavedCVRepository;
  embeddingProvider: EmbeddingProvider;
  llmProvider: LLMProvider;
}): Router {
  const router = Router();

  router.post("/applications", async (req, res, next) => {
    try {
      const jobDescriptionId = requireString(req.body, "jobDescriptionId");
      const body = requireObject(req.body);
      const savedCvId = "savedCvId" in body ? requireNullableString(req.body, "savedCvId") : undefined;

      const application = await createApplication(
        { jobDescriptionId, ...(savedCvId !== undefined ? { savedCvId } : {}) },
        req.sessionId,
        deps.applicationRepository,
        deps.jobDescriptionRepository,
        deps.savedCVRepository,
      );

      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  });

  router.get("/applications", async (req, res, next) => {
    try {
      const applications = await listApplications(req.sessionId, deps.applicationRepository);
      res.status(200).json(applications);
    } catch (error) {
      next(error);
    }
  });

  router.get("/applications/export.csv", async (req, res, next) => {
    try {
      const csv = await listApplicationsAsCsv(req.sessionId, deps.applicationRepository, deps.jobDescriptionRepository);
      res.status(200);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="applications.csv"');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/applications/:id/status", async (req, res, next) => {
    try {
      const status = requireString(req.body, "status");
      if (!APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
        throw new ValidationError(`status debe ser uno de: ${APPLICATION_STATUSES.join(", ")}`);
      }

      const application = await updateApplicationStatus(
        req.params["id"] as string,
        status as ApplicationStatus,
        req.sessionId,
        deps.applicationRepository,
      );

      res.status(200).json(application);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/applications/:id/details", async (req, res, next) => {
    try {
      const body = requireObject(req.body);
      const changes: { recruiter?: string | null; portal?: string | null; salaryRequested?: string | null; notes?: string | null } =
        {};
      for (const field of ["recruiter", "portal", "salaryRequested", "notes"] as const) {
        if (field in body) {
          changes[field] = requireNullableString(req.body, field);
        }
      }

      const application = await updateApplicationDetails(
        req.params["id"] as string,
        changes,
        req.sessionId,
        deps.applicationRepository,
      );

      res.status(200).json(application);
    } catch (error) {
      next(error);
    }
  });

  router.post("/applications/:id/generate-cv", async (req, res, next) => {
    try {
      const application = await generateSavedCVForApplication(
        req.params["id"] as string,
        req.sessionId,
        {
          applicationRepository: deps.applicationRepository,
          jobDescriptionRepository: deps.jobDescriptionRepository,
          workExperienceRepository: deps.workExperienceRepository,
          bulletRepository: deps.bulletRepository,
          savedCVRepository: deps.savedCVRepository,
        },
        deps.embeddingProvider,
        deps.llmProvider,
      );

      res.status(200).json(application);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
