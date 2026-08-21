import { describe, expect, it } from "vitest";
import { confirmParsedCV } from "../confirm-parsed-cv.js";
import { InMemoryWorkExperienceRepository } from "../../work-experiences/in-memory-work-experience-repository.js";
import { InMemoryBulletRepository } from "../../bullets/in-memory-bullet-repository.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import type { CVParseResult } from "../cv-parse-result.js";
import type { EmbeddingProvider } from "../../ports/embedding-provider.js";

function createFakeEmbeddingProvider(vector: number[] = [0.1, 0.2, 0.3]): EmbeddingProvider {
  return {
    async embed() {
      return vector;
    },
  };
}

const DRAFT: CVParseResult = {
  workExperiences: [
    {
      company: "Acme Corp",
      role: "Backend Engineer",
      startDate: "2020-01-01",
      endDate: "2022-06-01",
      bullets: [{ text: "Reduje el tiempo de build en 40%" }, { text: "Lideré un equipo de 5 personas" }],
    },
    {
      company: "Beta Inc",
      role: "Software Engineer",
      startDate: "2022-07-01",
      endDate: null,
      bullets: [{ text: "Migré el monolito a microservicios" }],
    },
  ],
};

describe("confirmParsedCV", () => {
  it("crea una WorkExperience por cada DraftWorkExperience del borrador", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const bulletRepository = new InMemoryBulletRepository();

    const result = await confirmParsedCV(
      DRAFT,
      { workExperienceRepository, bulletRepository },
      createFakeEmbeddingProvider(),
    );

    expect(result.workExperiences).toHaveLength(2);
    expect(result.workExperiences.map((we) => we.company)).toEqual(["Acme Corp", "Beta Inc"]);
    expect(await workExperienceRepository.list()).toHaveLength(2);
  });

  it("crea un Bullet por cada DraftBullet, asociado al workExperienceId real recién creado", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const bulletRepository = new InMemoryBulletRepository();

    const result = await confirmParsedCV(
      DRAFT,
      { workExperienceRepository, bulletRepository },
      createFakeEmbeddingProvider(),
    );

    expect(result.bullets).toHaveLength(3);
    const acme = result.workExperiences.find((we) => we.company === "Acme Corp");
    const acmeBullets = result.bullets.filter((bullet) => bullet.workExperienceId === acme?.id);
    expect(acmeBullets.map((bullet) => bullet.text)).toEqual([
      "Reduje el tiempo de build en 40%",
      "Lideré un equipo de 5 personas",
    ]);
  });

  it("asigna order según la posición en el array del borrador", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const bulletRepository = new InMemoryBulletRepository();

    const result = await confirmParsedCV(
      DRAFT,
      { workExperienceRepository, bulletRepository },
      createFakeEmbeddingProvider(),
    );

    expect(result.workExperiences[0]?.order).toBe(1);
    expect(result.workExperiences[1]?.order).toBe(2);
  });

  it("una DraftWorkExperience con endDate null crea la WorkExperience sin endDate", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const bulletRepository = new InMemoryBulletRepository();

    const result = await confirmParsedCV(
      DRAFT,
      { workExperienceRepository, bulletRepository },
      createFakeEmbeddingProvider(),
    );

    const beta = result.workExperiences.find((we) => we.company === "Beta Inc");
    expect(beta?.endDate).toBeUndefined();
  });

  it("devuelve tanto las WorkExperience como los Bullet creados", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const bulletRepository = new InMemoryBulletRepository();

    const result = await confirmParsedCV(
      DRAFT,
      { workExperienceRepository, bulletRepository },
      createFakeEmbeddingProvider(),
    );

    expect(await bulletRepository.list()).toEqual(result.bullets);
    expect(await workExperienceRepository.list()).toEqual(result.workExperiences);
  });

  it("un borrador vacío devuelve workExperiences y bullets vacíos, sin error", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const bulletRepository = new InMemoryBulletRepository();

    const result = await confirmParsedCV(
      { workExperiences: [] },
      { workExperienceRepository, bulletRepository },
      createFakeEmbeddingProvider(),
    );

    expect(result).toEqual({ workExperiences: [], bullets: [] });
  });

  it("lanza DuplicateError y no crea nada si el borrador incluye una WorkExperience ya existente", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const bulletRepository = new InMemoryBulletRepository();
    await createWorkExperience(
      { company: "Acme Corp", role: "Backend Engineer", startDate: new Date("2020-01-01"), order: 1 },
      workExperienceRepository,
    );

    await expect(
      confirmParsedCV(DRAFT, { workExperienceRepository, bulletRepository }, createFakeEmbeddingProvider()),
    ).rejects.toThrow("ya existe");
    expect(await workExperienceRepository.list()).toHaveLength(1);
    expect(await bulletRepository.list()).toHaveLength(0);
  });
});
