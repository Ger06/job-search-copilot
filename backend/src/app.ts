import express, { type Express } from "express";
import type { WorkExperienceRepository } from "./work-experiences/work-experience-repository.js";
import { createWorkExperienceRouter } from "./work-experiences/work-experience-router.js";
import type { BulletRepository } from "./bullets/bullet-repository.js";
import { createBulletRouter } from "./bullets/bullet-router.js";
import type { JobDescriptionRepository } from "./job-descriptions/job-description-repository.js";
import { createJobDescriptionRouter } from "./job-descriptions/job-description-router.js";
import type { ApplicationRepository } from "./applications/application-repository.js";
import { createApplicationRouter } from "./applications/application-router.js";
import type { SavedCVRepository } from "./saved-cvs/saved-cv-repository.js";
import { createCvImportRouter } from "./cv-import/cv-import-router.js";
import type { EmbeddingProvider } from "./ports/embedding-provider.js";
import type { LLMProvider } from "./ports/llm-provider.js";
import { errorHandlerMiddleware } from "./http/error-handler-middleware.js";

export type AppDependencies = {
  workExperienceRepository: WorkExperienceRepository;
  bulletRepository: BulletRepository;
  jobDescriptionRepository: JobDescriptionRepository;
  applicationRepository: ApplicationRepository;
  savedCVRepository: SavedCVRepository;
  embeddingProvider: EmbeddingProvider;
  llmProvider: LLMProvider;
};

export function createApp(deps: AppDependencies): Express {
  const app = express();
  app.use(express.json());

  app.use(createWorkExperienceRouter({ workExperienceRepository: deps.workExperienceRepository }));
  app.use(
    createBulletRouter({
      bulletRepository: deps.bulletRepository,
      workExperienceRepository: deps.workExperienceRepository,
      embeddingProvider: deps.embeddingProvider,
    }),
  );
  app.use(createJobDescriptionRouter({ jobDescriptionRepository: deps.jobDescriptionRepository }));
  app.use(
    createApplicationRouter({
      applicationRepository: deps.applicationRepository,
      jobDescriptionRepository: deps.jobDescriptionRepository,
      workExperienceRepository: deps.workExperienceRepository,
      bulletRepository: deps.bulletRepository,
      savedCVRepository: deps.savedCVRepository,
      embeddingProvider: deps.embeddingProvider,
      llmProvider: deps.llmProvider,
    }),
  );
  app.use(
    createCvImportRouter({
      workExperienceRepository: deps.workExperienceRepository,
      bulletRepository: deps.bulletRepository,
      embeddingProvider: deps.embeddingProvider,
      llmProvider: deps.llmProvider,
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: "No encontrado" });
  });

  app.use(errorHandlerMiddleware);

  return app;
}
