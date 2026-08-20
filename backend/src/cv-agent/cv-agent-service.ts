import type { JobDescription } from "../job-descriptions/job-description.js";
import type { JobDescriptionRepository } from "../job-descriptions/job-description-repository.js";
import { findJobDescriptionById } from "../job-descriptions/job-description-service.js";
import type { WorkExperience } from "../work-experiences/work-experience.js";
import type { WorkExperienceRepository } from "../work-experiences/work-experience-repository.js";
import { listWorkExperiences } from "../work-experiences/work-experience-service.js";
import type { BulletRepository } from "../bullets/bullet-repository.js";
import type { SavedCV } from "../saved-cvs/saved-cv.js";
import type { SavedCVRepository } from "../saved-cvs/saved-cv-repository.js";
import { createSavedCV } from "../saved-cvs/saved-cv-service.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { LLMProvider } from "../ports/llm-provider.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { CV_AGENT_SYSTEM_PROMPT } from "./cv-agent-system-prompt.js";
import { GET_RELEVANT_BULLETS_TOOL, createGetRelevantBulletsExecutor } from "./get-relevant-bullets-tool.js";
import { validateNoFabricatedContactInfo } from "./validate-no-fabricated-contact-info.js";

function formatWorkExperienceDates(workExperience: WorkExperience): string {
  const start = workExperience.startDate.toISOString().slice(0, 10);
  const end = workExperience.endDate ? workExperience.endDate.toISOString().slice(0, 10) : "presente";
  return `${start} a ${end}`;
}

export function buildCVUserPrompt(jobDescription: JobDescription, workExperiences: WorkExperience[]): string {
  const experiencesList = workExperiences
    .map(
      (workExperience) =>
        `- work_experience_id: ${workExperience.id} | ${workExperience.role} en ${workExperience.company} (${formatWorkExperienceDates(workExperience)})`,
    )
    .join("\n");

  return `Vacante: ${jobDescription.role} en ${jobDescription.company}

Descripción de la vacante:
${jobDescription.rawText}

Historial completo de work experiences (TODAS deben quedar reflejadas en el CV, ninguna puede faltar):
${experiencesList}

Para CADA una de las work experiences de arriba, llamá la tool get_relevant_bullets_for_experience con su work_experience_id antes de escribir el contenido correspondiente a esa experiencia. Después armá el contenido completo del CV en texto plano/markdown, organizado por experiencia, priorizando los bullets más relevantes para la vacante.`;
}

export function buildCoverLetterUserPrompt(jobDescription: JobDescription, cvContent: string): string {
  return `Vacante: ${jobDescription.role} en ${jobDescription.company}

Descripción de la vacante:
${jobDescription.rawText}

CV ya generado para esta vacante (única fuente de información sobre la experiencia de la persona):
${cvContent}

Escribí una cover letter en texto plano/markdown para esta vacante, basada únicamente en la información del CV de arriba.`;
}

export async function generateTailoredCV(
  jobDescriptionId: string,
  repositories: {
    jobDescriptionRepository: JobDescriptionRepository;
    workExperienceRepository: WorkExperienceRepository;
    bulletRepository: BulletRepository;
    savedCVRepository: SavedCVRepository;
  },
  embeddingProvider: EmbeddingProvider,
  llmProvider: LLMProvider,
): Promise<SavedCV> {
  const jobDescription = await findJobDescriptionById(jobDescriptionId, repositories.jobDescriptionRepository);
  if (jobDescription === undefined) {
    throw new NotFoundError("JobDescription", jobDescriptionId);
  }

  const workExperiences = await listWorkExperiences(repositories.workExperienceRepository);

  const content = await llmProvider.generate(
    [
      { role: "system", content: CV_AGENT_SYSTEM_PROMPT },
      { role: "user", content: buildCVUserPrompt(jobDescription, workExperiences) },
    ],
    [GET_RELEVANT_BULLETS_TOOL],
    createGetRelevantBulletsExecutor(jobDescription.rawText, repositories.bulletRepository, embeddingProvider),
  );
  validateNoFabricatedContactInfo(content);

  const coverLetterContent = await llmProvider.generate(
    [
      { role: "system", content: CV_AGENT_SYSTEM_PROMPT },
      { role: "user", content: buildCoverLetterUserPrompt(jobDescription, content) },
    ],
    [],
    async (toolName) => {
      throw new Error(`No hay tools disponibles para esta llamada, se intentó llamar: ${toolName}`);
    },
  );
  validateNoFabricatedContactInfo(coverLetterContent);

  return createSavedCV(
    { jobDescriptionId, content, coverLetterContent },
    repositories.savedCVRepository,
    repositories.jobDescriptionRepository,
  );
}
