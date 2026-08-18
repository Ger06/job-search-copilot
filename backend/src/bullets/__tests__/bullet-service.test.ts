import { describe, expect, it } from "vitest";
import { createBullet, findBulletById, listBullets } from "../bullet-service.js";
import { InMemoryBulletRepository } from "../in-memory-bullet-repository.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import { InMemoryWorkExperienceRepository } from "../../work-experiences/in-memory-work-experience-repository.js";
import { NotFoundError } from "../../errors/not-found-error.js";

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

describe("createBullet", () => {
  it("crea un bullet con el texto dado", () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = createTestWorkExperience(workExperienceRepository);

    const bullet = createBullet(
      { text: "Corriste en floresta", workExperienceId: workExperience.id },
      new InMemoryBulletRepository(),
      workExperienceRepository,
    );

    expect(bullet.text).toBe("Corriste en floresta");
  });

  it("asigna un id único a cada bullet creado", () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = createTestWorkExperience(workExperienceRepository);
    const bulletRepository = new InMemoryBulletRepository();

    const first = createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
    );
    const second = createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
    );

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);
  });

  it("asigna la fecha de creación al bullet creado", () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = createTestWorkExperience(workExperienceRepository);

    const before = new Date();
    const bullet = createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      new InMemoryBulletRepository(),
      workExperienceRepository,
    );
    const after = new Date();

    expect(bullet.createdAt).toBeInstanceOf(Date);
    expect(bullet.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(bullet.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("asigna el workExperienceId dado al bullet creado", () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = createTestWorkExperience(workExperienceRepository);

    const bullet = createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      new InMemoryBulletRepository(),
      workExperienceRepository,
    );

    expect(bullet.workExperienceId).toBe(workExperience.id);
  });

  it("persiste el bullet en el repo", () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = createTestWorkExperience(workExperienceRepository);
    const bulletRepository = new InMemoryBulletRepository();

    const bullet = createBullet(
      { text: "Corriste en floresta", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
    );

    expect(bulletRepository.findById(bullet.id)).toEqual(bullet);
  });

  it("lanza NotFoundError si el workExperienceId no corresponde a ningún work experience existente", () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const bulletRepository = new InMemoryBulletRepository();

    expect(() =>
      createBullet(
        { text: "Corriste en floresta", workExperienceId: "no-existe" },
        bulletRepository,
        workExperienceRepository,
      ),
    ).toThrow(new NotFoundError("WorkExperience", "no-existe"));
  });
});

describe("findBulletById", () => {
  it("devuelve undefined si no existe un bullet con ese id", () => {
    const repository = new InMemoryBulletRepository();

    const result = findBulletById("no-existe", repository);

    expect(result).toBeUndefined();
  });
});

describe("listBullets", () => {
  it("devuelve todos los bullets guardados", () => {
    const workExperienceRepository = new InMemoryWorkExperienceRepository();
    const workExperience = createTestWorkExperience(workExperienceRepository);
    const bulletRepository = new InMemoryBulletRepository();

    const first = createBullet(
      { text: "Corriste en floresta", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
    );
    const second = createBullet(
      { text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id },
      bulletRepository,
      workExperienceRepository,
    );

    const result = listBullets(bulletRepository);

    expect(result).toEqual([first, second]);
  });
});
