import { describe, expect, it } from "vitest";
import { generateSavedCVForApplication } from "../generate-saved-cv-for-application.js";
import { GET_RELEVANT_BULLETS_TOOL } from "../../cv-agent/get-relevant-bullets-tool.js";
import { createApplication } from "../application-service.js";
import { InMemoryApplicationRepository } from "../in-memory-application-repository.js";
import { createJobDescription } from "../../job-descriptions/job-description-service.js";
import { InMemoryJobDescriptionRepository } from "../../job-descriptions/in-memory-job-description-repository.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import { InMemoryWorkExperienceRepository } from "../../work-experiences/in-memory-work-experience-repository.js";
import { InMemoryBulletRepository } from "../../bullets/in-memory-bullet-repository.js";
import { InMemorySavedCVRepository } from "../../saved-cvs/in-memory-saved-cv-repository.js";
import { NotFoundError } from "../../errors/not-found-error.js";
import type { EmbeddingProvider } from "../../ports/embedding-provider.js";
import type { LLMProvider } from "../../ports/llm-provider.js";
import { TEST_SESSION_ID, OTHER_TEST_SESSION_ID } from "../../__tests__/test-app-dependencies.js";

function createFakeEmbeddingProvider(vector: number[] = [0.1, 0.2, 0.3]): EmbeddingProvider {
  return {
    async embed() {
      return vector;
    },
  };
}

function createFakeLLMProvider(workExperienceIdsToCover: string[]): LLMProvider {
  let callIndex = 0;
  return {
    async generate(_messages, _tools, executeTool) {
      if (callIndex === 0) {
        for (const workExperienceId of workExperienceIdsToCover) {
          await executeTool(GET_RELEVANT_BULLETS_TOOL.name, { work_experience_id: workExperienceId });
        }
      }
      const content = callIndex === 0 ? "CONTENIDO DEL CV" : "CONTENIDO DE LA COVER LETTER";
      callIndex += 1;
      return content;
    },
    async generateStructuredOutput() {
      throw new Error("no debería llamarse a generateStructuredOutput en este test");
    },
  };
}

async function setUpFixture() {
  const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
  const jobDescription = await createJobDescription(
    { company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer con experiencia en Node.js" },
    TEST_SESSION_ID,
    jobDescriptionRepository,
  );
  const workExperienceRepository = new InMemoryWorkExperienceRepository();
  const workExperience = await createWorkExperience(
    { company: "Beta Inc", role: "Software Engineer", startDate: new Date("2020-01-01"), order: 1 },
    TEST_SESSION_ID,
    workExperienceRepository,
  );
  const bulletRepository = new InMemoryBulletRepository();
  const savedCVRepository = new InMemorySavedCVRepository();
  const applicationRepository = new InMemoryApplicationRepository();
  const application = await createApplication(
    { jobDescriptionId: jobDescription.id },
    TEST_SESSION_ID,
    applicationRepository,
    jobDescriptionRepository,
    savedCVRepository,
  );
  const embeddingProvider = createFakeEmbeddingProvider();

  return {
    jobDescriptionRepository,
    jobDescription,
    workExperienceRepository,
    workExperience,
    bulletRepository,
    savedCVRepository,
    applicationRepository,
    application,
    embeddingProvider,
  };
}

describe("generateSavedCVForApplication", () => {
  it("lanza NotFoundError si la Application no existe", async () => {
    const fixture = await setUpFixture();

    await expect(
      generateSavedCVForApplication(
        "no-existe",
        TEST_SESSION_ID,
        {
          applicationRepository: fixture.applicationRepository,
          jobDescriptionRepository: fixture.jobDescriptionRepository,
          workExperienceRepository: fixture.workExperienceRepository,
          bulletRepository: fixture.bulletRepository,
          savedCVRepository: fixture.savedCVRepository,
        },
        fixture.embeddingProvider,
        createFakeLLMProvider([fixture.workExperience.id]),
      ),
    ).rejects.toThrow(new NotFoundError("Application", "no-existe"));
  });

  it("lanza NotFoundError si se intenta generar el CV de una Application de otra sesión", async () => {
    const fixture = await setUpFixture();

    await expect(
      generateSavedCVForApplication(
        fixture.application.id,
        OTHER_TEST_SESSION_ID,
        {
          applicationRepository: fixture.applicationRepository,
          jobDescriptionRepository: fixture.jobDescriptionRepository,
          workExperienceRepository: fixture.workExperienceRepository,
          bulletRepository: fixture.bulletRepository,
          savedCVRepository: fixture.savedCVRepository,
        },
        fixture.embeddingProvider,
        createFakeLLMProvider([fixture.workExperience.id]),
      ),
    ).rejects.toThrow(new NotFoundError("Application", fixture.application.id));
  });

  it("genera el SavedCV y lo linkea (savedCvId) a la Application", async () => {
    const fixture = await setUpFixture();

    const updated = await generateSavedCVForApplication(
      fixture.application.id,
      TEST_SESSION_ID,
      {
        applicationRepository: fixture.applicationRepository,
        jobDescriptionRepository: fixture.jobDescriptionRepository,
        workExperienceRepository: fixture.workExperienceRepository,
        bulletRepository: fixture.bulletRepository,
        savedCVRepository: fixture.savedCVRepository,
      },
      fixture.embeddingProvider,
      createFakeLLMProvider([fixture.workExperience.id]),
    );

    expect(updated.savedCvId).not.toBeNull();
    const savedCV = await fixture.savedCVRepository.findById(updated.savedCvId as string, TEST_SESSION_ID);
    expect(savedCV?.content).toBe("CONTENIDO DEL CV");
    expect(savedCV?.coverLetterContent).toBe("CONTENIDO DE LA COVER LETTER");
  });

  it("calcula y persiste el fitScore devuelto por generateTailoredCV en la Application", async () => {
    const fixture = await setUpFixture();

    const updated = await generateSavedCVForApplication(
      fixture.application.id,
      TEST_SESSION_ID,
      {
        applicationRepository: fixture.applicationRepository,
        jobDescriptionRepository: fixture.jobDescriptionRepository,
        workExperienceRepository: fixture.workExperienceRepository,
        bulletRepository: fixture.bulletRepository,
        savedCVRepository: fixture.savedCVRepository,
      },
      fixture.embeddingProvider,
      createFakeLLMProvider([fixture.workExperience.id]),
    );

    // La work experience se cubrió (la tool se llamó), pero no tiene
    // ningún bullet cargado — fitScore queda null, mismo comportamiento
    // ya probado en generateTailoredCV.
    expect(updated.fitScore).toBeNull();
    expect(await fixture.applicationRepository.findById(fixture.application.id, TEST_SESSION_ID)).toEqual(updated);
  });
});
