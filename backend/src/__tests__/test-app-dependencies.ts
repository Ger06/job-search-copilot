import type { Express } from "express";
import request from "supertest";
import type { AppDependencies } from "../app.js";
import { InMemoryWorkExperienceRepository } from "../work-experiences/in-memory-work-experience-repository.js";
import { InMemoryBulletRepository } from "../bullets/in-memory-bullet-repository.js";
import { InMemoryJobDescriptionRepository } from "../job-descriptions/in-memory-job-description-repository.js";
import { InMemoryApplicationRepository } from "../applications/in-memory-application-repository.js";
import { InMemorySavedCVRepository } from "../saved-cvs/in-memory-saved-cv-repository.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { LLMProvider } from "../ports/llm-provider.js";

// Sesiones de prueba fijas — dos ids distintos para poder probar
// aislamiento (sesión A no ve/toca datos de sesión B) en los tests de
// servicio y de router.
export const TEST_SESSION_ID = "11111111-1111-4111-8111-111111111111";
export const OTHER_TEST_SESSION_ID = "22222222-2222-4222-8222-222222222222";

// Wrapper de supertest que manda X-Session-Id automáticamente — evita
// repetir .set(...) en cada request de cada test de router.
export function sessionRequest(app: Express) {
  return {
    get: (path: string) => request(app).get(path).set("X-Session-Id", TEST_SESSION_ID),
    post: (path: string) => request(app).post(path).set("X-Session-Id", TEST_SESSION_ID),
    patch: (path: string) => request(app).patch(path).set("X-Session-Id", TEST_SESSION_ID),
  };
}

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
