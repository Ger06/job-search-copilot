import type { Application } from "./application.js";
import type { ApplicationRepository } from "./application-repository.js";
import { linkSavedCVToApplication } from "./application-service.js";
import type { JobDescriptionRepository } from "../job-descriptions/job-description-repository.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import type { BulletRepository } from "../bullets/bullet-repository.js";
import type { SavedCVRepository } from "../saved-cvs/saved-cv-repository.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { LLMProvider } from "../ports/llm-provider.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { generateTailoredCV } from "../cv-agent/cv-agent-service.js";

export async function generateSavedCVForApplication(
  applicationId: string,
  sessionId: string,
  repositories: {
    applicationRepository: ApplicationRepository;
    jobDescriptionRepository: JobDescriptionRepository;
    workExperienceRepository: WorkExperienceRepository;
    bulletRepository: BulletRepository;
    savedCVRepository: SavedCVRepository;
  },
  embeddingProvider: EmbeddingProvider,
  llmProvider: LLMProvider,
): Promise<Application> {
  const application = await repositories.applicationRepository.findById(applicationId, sessionId);
  if (application === undefined) {
    throw new NotFoundError("Application", applicationId);
  }

  const { savedCV, fitScore } = await generateTailoredCV(
    application.jobDescriptionId,
    sessionId,
    {
      jobDescriptionRepository: repositories.jobDescriptionRepository,
      workExperienceRepository: repositories.workExperienceRepository,
      bulletRepository: repositories.bulletRepository,
      savedCVRepository: repositories.savedCVRepository,
    },
    embeddingProvider,
    llmProvider,
  );

  return linkSavedCVToApplication(applicationId, savedCV.id, fitScore, sessionId, repositories.applicationRepository);
}
