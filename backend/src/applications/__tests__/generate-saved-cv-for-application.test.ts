import { describe, expect, it } from "vitest";
import { generateSavedCVForApplication } from "../generate-saved-cv-for-application.js";
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

function createFakeEmbeddingProvider(vector: number[] = [0.1, 0.2, 0.3]): EmbeddingProvider {
  return {
    async embed() {
      return vector;
    },
  };
}

function createFakeLLMProvider(): LLMProvider {
  let callIndex = 0;
  return {
    async generate() {
      const content = callIndex === 0 ? "CONTENIDO DEL CV" : "CONTENIDO DE LA COVER LETTER";
      callIndex += 1;
      return content;
    },
  };
}

async function setUpFixture() {
  const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
  const jobDescription = await createJobDescription(
    { company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer con experiencia en Node.js" },
    jobDescriptionRepository,
  );
  const workExperienceRepository = new InMemoryWorkExperienceRepository();
  await createWorkExperience(
    { company: "Beta Inc", role: "Software Engineer", startDate: new Date("2020-01-01"), order: 1 },
    workExperienceRepository,
  );
  const bulletRepository = new InMemoryBulletRepository();
  const savedCVRepository = new InMemorySavedCVRepository();
  const applicationRepository = new InMemoryApplicationRepository();
  const application = await createApplication(
    { jobDescriptionId: jobDescription.id },
    applicationRepository,
    jobDescriptionRepository,
    savedCVRepository,
  );
  const embeddingProvider = createFakeEmbeddingProvider();

  return {
    jobDescriptionRepository,
    jobDescription,
    workExperienceRepository,
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
        {
          applicationRepository: fixture.applicationRepository,
          jobDescriptionRepository: fixture.jobDescriptionRepository,
          workExperienceRepository: fixture.workExperienceRepository,
          bulletRepository: fixture.bulletRepository,
          savedCVRepository: fixture.savedCVRepository,
        },
        fixture.embeddingProvider,
        createFakeLLMProvider(),
      ),
    ).rejects.toThrow(new NotFoundError("Application", "no-existe"));
  });

  it("genera el SavedCV y lo linkea (savedCvId) a la Application", async () => {
    const fixture = await setUpFixture();

    const updated = await generateSavedCVForApplication(
      fixture.application.id,
      {
        applicationRepository: fixture.applicationRepository,
        jobDescriptionRepository: fixture.jobDescriptionRepository,
        workExperienceRepository: fixture.workExperienceRepository,
        bulletRepository: fixture.bulletRepository,
        savedCVRepository: fixture.savedCVRepository,
      },
      fixture.embeddingProvider,
      createFakeLLMProvider(),
    );

    expect(updated.savedCvId).not.toBeNull();
    const savedCV = await fixture.savedCVRepository.findById(updated.savedCvId as string);
    expect(savedCV?.content).toBe("CONTENIDO DEL CV");
    expect(savedCV?.coverLetterContent).toBe("CONTENIDO DE LA COVER LETTER");
  });

  it("calcula y persiste el fitScore devuelto por generateTailoredCV en la Application", async () => {
    const fixture = await setUpFixture();

    const updated = await generateSavedCVForApplication(
      fixture.application.id,
      {
        applicationRepository: fixture.applicationRepository,
        jobDescriptionRepository: fixture.jobDescriptionRepository,
        workExperienceRepository: fixture.workExperienceRepository,
        bulletRepository: fixture.bulletRepository,
        savedCVRepository: fixture.savedCVRepository,
      },
      fixture.embeddingProvider,
      createFakeLLMProvider(),
    );

    // La tool nunca se llamó (el LLMProvider fake no la invoca), así que
    // fitScore queda null — mismo comportamiento ya probado en generateTailoredCV.
    expect(updated.fitScore).toBeNull();
    expect(await fixture.applicationRepository.findById(fixture.application.id)).toEqual(updated);
  });
});
