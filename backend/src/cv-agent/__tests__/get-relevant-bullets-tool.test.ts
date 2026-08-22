import { describe, expect, it } from "vitest";
import { createGetRelevantBulletsExecutor } from "../get-relevant-bullets-tool.js";
import { createBullet } from "../../bullets/bullet-service.js";
import { InMemoryBulletRepository } from "../../bullets/in-memory-bullet-repository.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import { InMemoryWorkExperienceRepository } from "../../work-experiences/in-memory-work-experience-repository.js";
import type { EmbeddingProvider } from "../../ports/embedding-provider.js";
import { TEST_SESSION_ID } from "../../__tests__/test-app-dependencies.js";

function createFakeEmbeddingProvider(vector: number[] = [0.1, 0.2, 0.3]): EmbeddingProvider {
  return {
    async embed() {
      return vector;
    },
  };
}

describe("createGetRelevantBulletsExecutor", () => {
  it("devuelve el JSON de los bullets relevantes para el work_experience_id dado", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = await createWorkExperience(
      { company: "Acme Corp", role: "Backend Engineer", startDate: new Date("2022-01-15"), order: 1 },
      TEST_SESSION_ID,
      workExperienceRepository,
    );
    const bulletRepository = new InMemoryBulletRepository();
    const embeddingProvider = createFakeEmbeddingProvider();
    const bullet = await createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      TEST_SESSION_ID,
      bulletRepository,
      workExperienceRepository,
      embeddingProvider,
    );

    const executor = createGetRelevantBulletsExecutor("vacante de backend", TEST_SESSION_ID, bulletRepository, embeddingProvider);
    const result = await executor("get_relevant_bullets_for_experience", { work_experience_id: workExperience.id });

    expect(JSON.parse(result)).toEqual([bullet.text]);
  });

  it("lanza error si se lo llama con un nombre de tool desconocido", async () => {
    const executor = createGetRelevantBulletsExecutor(
      "vacante de backend",
      TEST_SESSION_ID,
      new InMemoryBulletRepository(),
      createFakeEmbeddingProvider(),
    );

    await expect(executor("otra_tool", { work_experience_id: "algún-id" })).rejects.toThrow(
      "Tool desconocida: otra_tool",
    );
  });

  it("lanza error si work_experience_id no es un string", async () => {
    const executor = createGetRelevantBulletsExecutor(
      "vacante de backend",
      TEST_SESSION_ID,
      new InMemoryBulletRepository(),
      createFakeEmbeddingProvider(),
    );

    await expect(
      executor("get_relevant_bullets_for_experience", { work_experience_id: 123 }),
    ).rejects.toThrow("work_experience_id inválido");
  });
});
