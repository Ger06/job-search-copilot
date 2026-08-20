import { describe, expect, it } from "vitest";
import { generateTailoredCV } from "../cv-agent-service.js";
import { GET_RELEVANT_BULLETS_TOOL } from "../get-relevant-bullets-tool.js";
import { createJobDescription } from "../../job-descriptions/job-description-service.js";
import { InMemoryJobDescriptionRepository } from "../../job-descriptions/in-memory-job-description-repository.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import { InMemoryWorkExperienceRepository } from "../../work-experiences/in-memory-work-experience-repository.js";
import { createBullet } from "../../bullets/bullet-service.js";
import { InMemoryBulletRepository } from "../../bullets/in-memory-bullet-repository.js";
import { InMemorySavedCVRepository } from "../../saved-cvs/in-memory-saved-cv-repository.js";
import { NotFoundError } from "../../errors/not-found-error.js";
import { FabricatedContentError } from "../../errors/fabricated-content-error.js";
import type { EmbeddingProvider } from "../../ports/embedding-provider.js";
import type { LLMMessage, LLMProvider, LLMToolDefinition, LLMToolExecutor } from "../../ports/llm-provider.js";

function createFakeEmbeddingProvider(vector: number[] = [0.1, 0.2, 0.3]): EmbeddingProvider {
  return {
    async embed() {
      return vector;
    },
  };
}

type RecordedCall = { messages: LLMMessage[]; tools: LLMToolDefinition[] };

function createFakeLLMProvider(
  behavior: (call: RecordedCall, executeTool: LLMToolExecutor, callIndex: number) => Promise<string>,
): LLMProvider & { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  return {
    calls,
    async generate(messages, tools, executeTool) {
      const call: RecordedCall = { messages, tools };
      const callIndex = calls.length;
      calls.push(call);
      return behavior(call, executeTool, callIndex);
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
  const workExperienceA = await createWorkExperience(
    { company: "Beta Inc", role: "Software Engineer", startDate: new Date("2020-01-01"), order: 1 },
    workExperienceRepository,
  );
  const workExperienceB = await createWorkExperience(
    { company: "Gamma LLC", role: "Tech Lead", startDate: new Date("2022-01-01"), order: 2 },
    workExperienceRepository,
  );
  const bulletRepository = new InMemoryBulletRepository();
  const savedCVRepository = new InMemorySavedCVRepository();
  const embeddingProvider = createFakeEmbeddingProvider();

  return {
    jobDescriptionRepository,
    jobDescription,
    workExperienceRepository,
    workExperienceA,
    workExperienceB,
    bulletRepository,
    savedCVRepository,
    embeddingProvider,
  };
}

describe("generateTailoredCV", () => {
  it("lanza NotFoundError si el jobDescriptionId no existe", async () => {
    const { workExperienceRepository, bulletRepository, savedCVRepository, embeddingProvider } = await setUpFixture();
    const jobDescriptionRepository = new InMemoryJobDescriptionRepository();
    const llmProvider = createFakeLLMProvider(async () => {
      throw new Error("no debería llamarse al LLMProvider");
    });

    await expect(
      generateTailoredCV(
        "no-existe",
        { jobDescriptionRepository, workExperienceRepository, bulletRepository, savedCVRepository },
        embeddingProvider,
        llmProvider,
      ),
    ).rejects.toThrow(new NotFoundError("JobDescription", "no-existe"));
  });

  it("arma el SavedCV con el content y coverLetterContent de la primera y segunda llamada al LLMProvider", async () => {
    const fixture = await setUpFixture();
    const llmProvider = createFakeLLMProvider(async (_call, _executeTool, callIndex) => {
      return callIndex === 0 ? "CONTENIDO DEL CV" : "CONTENIDO DE LA COVER LETTER";
    });

    const savedCV = await generateTailoredCV(
      fixture.jobDescription.id,
      {
        jobDescriptionRepository: fixture.jobDescriptionRepository,
        workExperienceRepository: fixture.workExperienceRepository,
        bulletRepository: fixture.bulletRepository,
        savedCVRepository: fixture.savedCVRepository,
      },
      fixture.embeddingProvider,
      llmProvider,
    );

    expect(savedCV.content).toBe("CONTENIDO DEL CV");
    expect(savedCV.coverLetterContent).toBe("CONTENIDO DE LA COVER LETTER");
  });

  it("el executeTool de la primera llamada trae bullets reales de la work experience pedida", async () => {
    const fixture = await setUpFixture();
    const bullet = await createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: fixture.workExperienceA.id },
      fixture.bulletRepository,
      fixture.workExperienceRepository,
      fixture.embeddingProvider,
    );

    const llmProvider = createFakeLLMProvider(async (_call, executeTool, callIndex) => {
      if (callIndex === 0) {
        const toolResult = await executeTool(GET_RELEVANT_BULLETS_TOOL.name, {
          work_experience_id: fixture.workExperienceA.id,
        });
        return toolResult;
      }
      return "CONTENIDO DE LA COVER LETTER";
    });

    const savedCV = await generateTailoredCV(
      fixture.jobDescription.id,
      {
        jobDescriptionRepository: fixture.jobDescriptionRepository,
        workExperienceRepository: fixture.workExperienceRepository,
        bulletRepository: fixture.bulletRepository,
        savedCVRepository: fixture.savedCVRepository,
      },
      fixture.embeddingProvider,
      llmProvider,
    );

    expect(JSON.parse(savedCV.content)).toEqual([bullet.text]);
  });

  it("el prompt de la primera llamada menciona el id de cada work experience existente", async () => {
    const fixture = await setUpFixture();
    const llmProvider = createFakeLLMProvider(async (_call, _executeTool, callIndex) => {
      return callIndex === 0 ? "CONTENIDO DEL CV" : "CONTENIDO DE LA COVER LETTER";
    });

    await generateTailoredCV(
      fixture.jobDescription.id,
      {
        jobDescriptionRepository: fixture.jobDescriptionRepository,
        workExperienceRepository: fixture.workExperienceRepository,
        bulletRepository: fixture.bulletRepository,
        savedCVRepository: fixture.savedCVRepository,
      },
      fixture.embeddingProvider,
      llmProvider,
    );

    const firstCallUserMessage = llmProvider.calls[0]?.messages.find((message) => message.role === "user");
    expect(firstCallUserMessage?.content).toContain(fixture.workExperienceA.id);
    expect(firstCallUserMessage?.content).toContain(fixture.workExperienceB.id);
  });

  it("la segunda llamada no recibe tools y su prompt incluye el content generado en la primera", async () => {
    const fixture = await setUpFixture();
    const llmProvider = createFakeLLMProvider(async (_call, _executeTool, callIndex) => {
      return callIndex === 0 ? "CONTENIDO DEL CV" : "CONTENIDO DE LA COVER LETTER";
    });

    await generateTailoredCV(
      fixture.jobDescription.id,
      {
        jobDescriptionRepository: fixture.jobDescriptionRepository,
        workExperienceRepository: fixture.workExperienceRepository,
        bulletRepository: fixture.bulletRepository,
        savedCVRepository: fixture.savedCVRepository,
      },
      fixture.embeddingProvider,
      llmProvider,
    );

    const secondCall = llmProvider.calls[1];
    const secondCallUserMessage = secondCall?.messages.find((message) => message.role === "user");
    expect(secondCall?.tools).toEqual([]);
    expect(secondCallUserMessage?.content).toContain("CONTENIDO DEL CV");
  });

  it("lanza FabricatedContentError y no persiste nada si el LLMProvider devuelve un content con un email inventado", async () => {
    const fixture = await setUpFixture();
    const llmProvider = createFakeLLMProvider(async (_call, _executeTool, callIndex) => {
      return callIndex === 0 ? "Contactame a juan.perez@email.com" : "CONTENIDO DE LA COVER LETTER";
    });

    await expect(
      generateTailoredCV(
        fixture.jobDescription.id,
        {
          jobDescriptionRepository: fixture.jobDescriptionRepository,
          workExperienceRepository: fixture.workExperienceRepository,
          bulletRepository: fixture.bulletRepository,
          savedCVRepository: fixture.savedCVRepository,
        },
        fixture.embeddingProvider,
        llmProvider,
      ),
    ).rejects.toThrow(FabricatedContentError);

    expect(await fixture.savedCVRepository.list()).toEqual([]);
  });

  it("persiste el SavedCV en el repo", async () => {
    const fixture = await setUpFixture();
    const llmProvider = createFakeLLMProvider(async (_call, _executeTool, callIndex) => {
      return callIndex === 0 ? "CONTENIDO DEL CV" : "CONTENIDO DE LA COVER LETTER";
    });

    const savedCV = await generateTailoredCV(
      fixture.jobDescription.id,
      {
        jobDescriptionRepository: fixture.jobDescriptionRepository,
        workExperienceRepository: fixture.workExperienceRepository,
        bulletRepository: fixture.bulletRepository,
        savedCVRepository: fixture.savedCVRepository,
      },
      fixture.embeddingProvider,
      llmProvider,
    );

    expect(await fixture.savedCVRepository.findById(savedCV.id)).toEqual(savedCV);
  });
});
