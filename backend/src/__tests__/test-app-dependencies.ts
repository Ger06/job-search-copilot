import type { AppDependencies } from "../app.js";
import { InMemoryWorkExperienceRepository } from "../work-experiences/in-memory-work-experience-repository.js";
import { InMemoryBulletRepository } from "../bullets/in-memory-bullet-repository.js";
import { InMemoryJobDescriptionRepository } from "../job-descriptions/in-memory-job-description-repository.js";
import { InMemoryApplicationRepository } from "../applications/in-memory-application-repository.js";
import { InMemorySavedCVRepository } from "../saved-cvs/in-memory-saved-cv-repository.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { LLMProvider } from "../ports/llm-provider.js";

export function createFakeEmbeddingProvider(vector: number[] = [0.1, 0.2, 0.3]): EmbeddingProvider {
  return {
    async embed() {
      return vector;
    },
  };
}

// LLMProvider fake por default para tests de routers que no ejercitan
// ningún endpoint que llame al LLM — si algo lo invoca por error, el
// test falla ruidosamente en vez de colgarse esperando a Groq real.
export function createUnusedLLMProvider(): LLMProvider {
  return {
    async generate() {
      throw new Error("no debería llamarse a generate en este test");
    },
    async generateStructuredOutput() {
      throw new Error("no debería llamarse a generateStructuredOutput en este test");
    },
  };
}

export function createTestAppDependencies(overrides: Partial<AppDependencies> = {}): AppDependencies {
  return {
    workExperienceRepository: new InMemoryWorkExperienceRepository(),
    bulletRepository: new InMemoryBulletRepository(),
    jobDescriptionRepository: new InMemoryJobDescriptionRepository(),
    applicationRepository: new InMemoryApplicationRepository(),
    savedCVRepository: new InMemorySavedCVRepository(),
    embeddingProvider: createFakeEmbeddingProvider(),
    llmProvider: createUnusedLLMProvider(),
    ...overrides,
  };
}
