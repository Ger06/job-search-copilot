import { describe, expect, it } from "vitest";
import { createBullet, findRelevantBullets } from "../bullet-service.js";
import { InMemoryBulletRepository } from "../in-memory-bullet-repository.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import { InMemoryWorkExperienceRepository } from "../../work-experiences/in-memory-work-experience-repository.js";
import { LocalEmbeddingProvider } from "../../ports/local-embedding-provider.js";
import { TEST_SESSION_ID } from "../../__tests__/test-app-dependencies.js";

describe("findRelevantBullets (integración, LocalEmbeddingProvider real)", () => {
  it("ordena primero el bullet más relacionado con el texto de la vacante", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = await createWorkExperience(
      {
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
      workExperienceRepository,
    );
    const bulletRepository = new InMemoryBulletRepository();
    const embeddingProvider = new LocalEmbeddingProvider();

    const relevantBullet = await createBullet(
      { text: "Optimicé el pipeline de CI y reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      TEST_SESSION_ID,
      bulletRepository,
      workExperienceRepository,
      embeddingProvider,
    );
    await createBullet(
      { text: "Organicé el picnic anual de la oficina", workExperienceId: workExperience.id },
      TEST_SESSION_ID,
      bulletRepository,
      workExperienceRepository,
      embeddingProvider,
    );

    const result = await findRelevantBullets(
      "Buscamos un ingeniero backend con experiencia optimizando pipelines de CI/CD",
      workExperience.id,
      TEST_SESSION_ID,
      bulletRepository,
      embeddingProvider,
    );

    expect(result[0]?.id).toBe(relevantBullet.id);
  });
});
