import { describe, expect, it } from "vitest";
import {
  createBullet,
  findBulletsByWorkExperienceId,
  findBulletById,
  findRelevantBullets,
  listBullets,
} from "../bullet-service.js";
import { InMemoryBulletRepository } from "../in-memory-bullet-repository.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import { InMemoryWorkExperienceRepository } from "../../work-experiences/in-memory-work-experience-repository.js";
import { NotFoundError } from "../../errors/not-found-error.js";
import type { EmbeddingProvider } from "../../ports/embedding-provider.js";

function createTestWorkExperience(repository: InMemoryWorkExperienceRepository) {
  return createWorkExperience(
    {
      company: "Acme Corp",
      role: "Backend Engineer",
      startDate: new Date("2022-01-15"),
      order: 1,
    },
    repository,
  );
}

function createFakeEmbeddingProvider(vector: number[] = [0.1, 0.2, 0.3]): EmbeddingProvider {
  return {
    async embed() {
      return vector;
    },
  };
}

function createFakeEmbeddingProviderFromMap(vectorsByText: Record<string, number[]>): EmbeddingProvider {
  return {
    async embed(text: string) {
      const vector = vectorsByText[text];
      if (vector === undefined) {
        throw new Error(`No hay vector fake para el texto: ${text}`);
      }
      return vector;
    },
  };
}

describe("createBullet", () => {
  it("crea un bullet con el texto dado", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = await createTestWorkExperience(workExperienceRepository);

    const bullet = await createBullet(
      { text: "Corriste en floresta", workExperienceId: workExperience.id },
      new InMemoryBulletRepository(),
      workExperienceRepository,
      createFakeEmbeddingProvider(),
    );

    expect(bullet.text).toBe("Corriste en floresta");
  });

  it("genera el embedding del texto usando el EmbeddingProvider inyectado", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = await createTestWorkExperience(workExperienceRepository);
    const embeddingProvider = createFakeEmbeddingProvider([0.1, 0.2, 0.3]);

    const bullet = await createBullet(
      { text: "Corriste en floresta", workExperienceId: workExperience.id },
      new InMemoryBulletRepository(),
      workExperienceRepository,
      embeddingProvider,
    );

    expect(bullet.embedding).toEqual([0.1, 0.2, 0.3]);
  });

  it("asigna un id único a cada bullet creado", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = await createTestWorkExperience(workExperienceRepository);
    const bulletRepository = new InMemoryBulletRepository();

    const first = await createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
      createFakeEmbeddingProvider(),
    );
    const second = await createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
      createFakeEmbeddingProvider(),
    );

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);
  });

  it("asigna la fecha de creación al bullet creado", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = await createTestWorkExperience(workExperienceRepository);

    const before = new Date();
    const bullet = await createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      new InMemoryBulletRepository(),
      workExperienceRepository,
      createFakeEmbeddingProvider(),
    );
    const after = new Date();

    expect(bullet.createdAt).toBeInstanceOf(Date);
    expect(bullet.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(bullet.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("asigna el workExperienceId dado al bullet creado", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = await createTestWorkExperience(workExperienceRepository);

    const bullet = await createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      new InMemoryBulletRepository(),
      workExperienceRepository,
      createFakeEmbeddingProvider(),
    );

    expect(bullet.workExperienceId).toBe(workExperience.id);
  });

  it("persiste el bullet en el repo", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = await createTestWorkExperience(workExperienceRepository);
    const bulletRepository = new InMemoryBulletRepository();

    const bullet = await createBullet(
      { text: "Corriste en floresta", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
      createFakeEmbeddingProvider(),
    );

    expect(await bulletRepository.findById(bullet.id)).toEqual(bullet);
  });

  it("lanza NotFoundError si el workExperienceId no corresponde a ningún work experience existente", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const bulletRepository = new InMemoryBulletRepository();

    await expect(
      createBullet(
        { text: "Corriste en floresta", workExperienceId: "no-existe" },
        bulletRepository,
        workExperienceRepository,
        createFakeEmbeddingProvider(),
      ),
    ).rejects.toThrow(new NotFoundError("WorkExperience", "no-existe"));
  });
});

describe("findBulletsByWorkExperienceId", () => {
  it("devuelve solo los bullets de la work experience indicada", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperienceA = await createTestWorkExperience(workExperienceRepository);
    const workExperienceB = await createWorkExperience(
      {
        company: "Beta Inc",
        role: "Tech Lead",
        startDate: new Date("2023-07-01"),
        order: 2,
      },
      workExperienceRepository,
    );
    const bulletRepository = new InMemoryBulletRepository();

    const bulletA = await createBullet(
      { text: "Corriste en floresta", workExperienceId: workExperienceA.id },
      bulletRepository,
      workExperienceRepository,
      createFakeEmbeddingProvider(),
    );
    await createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperienceB.id },
      bulletRepository,
      workExperienceRepository,
      createFakeEmbeddingProvider(),
    );

    const result = await findBulletsByWorkExperienceId(workExperienceA.id, bulletRepository);

    expect(result).toEqual([bulletA]);
  });
});

describe("findRelevantBullets", () => {
  it("devuelve los bullets de la work experience ordenados por similitud coseno descendente con la vacante", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = await createTestWorkExperience(workExperienceRepository);
    const bulletRepository = new InMemoryBulletRepository();

    const vectorsByText: Record<string, number[]> = {
      "vacante de backend": [1, 0],
      "Optimicé el pipeline de CI": [1, 0],
      "Organicé el picnic de la oficina": [0, 1],
    };
    const embeddingProvider = createFakeEmbeddingProviderFromMap(vectorsByText);

    const farBullet = await createBullet(
      { text: "Organicé el picnic de la oficina", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
      embeddingProvider,
    );
    const closeBullet = await createBullet(
      { text: "Optimicé el pipeline de CI", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
      embeddingProvider,
    );

    const result = await findRelevantBullets(
      "vacante de backend",
      workExperience.id,
      bulletRepository,
      embeddingProvider,
    );

    expect(result).toEqual([closeBullet, farBullet]);
  });

  it("no mezcla bullets de otra work experience", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperienceA = await createTestWorkExperience(workExperienceRepository);
    const workExperienceB = await createWorkExperience(
      {
        company: "Beta Inc",
        role: "Tech Lead",
        startDate: new Date("2023-07-01"),
        order: 2,
      },
      workExperienceRepository,
    );
    const bulletRepository = new InMemoryBulletRepository();

    const vectorsByText: Record<string, number[]> = {
      "vacante de backend": [1, 0],
      "Bullet de la experiencia A": [1, 0],
      "Bullet de la experiencia B": [1, 0],
    };
    const embeddingProvider = createFakeEmbeddingProviderFromMap(vectorsByText);

    const bulletA = await createBullet(
      { text: "Bullet de la experiencia A", workExperienceId: workExperienceA.id },
      bulletRepository,
      workExperienceRepository,
      embeddingProvider,
    );
    await createBullet(
      { text: "Bullet de la experiencia B", workExperienceId: workExperienceB.id },
      bulletRepository,
      workExperienceRepository,
      embeddingProvider,
    );

    const result = await findRelevantBullets(
      "vacante de backend",
      workExperienceA.id,
      bulletRepository,
      embeddingProvider,
    );

    expect(result).toEqual([bulletA]);
  });
});

describe("findBulletById", () => {
  it("devuelve undefined si no existe un bullet con ese id", async () => {
    const repository = new InMemoryBulletRepository();

    const result = await findBulletById("no-existe", repository);

    expect(result).toBeUndefined();
  });
});

describe("listBullets", () => {
  it("devuelve todos los bullets guardados", async () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = await createTestWorkExperience(workExperienceRepository);
    const bulletRepository = new InMemoryBulletRepository();

    const first = await createBullet(
      { text: "Corriste en floresta", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
      createFakeEmbeddingProvider(),
    );
    const second = await createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
      createFakeEmbeddingProvider(),
    );

    const result = await listBullets(bulletRepository);

    expect(result).toEqual([first, second]);
  });
});
