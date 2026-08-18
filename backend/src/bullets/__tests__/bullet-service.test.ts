import { describe, expect, it } from "vitest";
import { createBullet } from "../bullet-service.js";

describe("createBullet", () => {
  it("crea un bullet con el texto dado", () => {
    const bullet = createBullet({
      text: "Corriste en floresta",
      workExperienceId: "we-1",
    });

    expect(bullet.text).toBe("Corriste en floresta");
  });

  it("asigna un id único a cada bullet creado", () => {
    const first = createBullet({
      text: "Reduje el tiempo de build en 40%",
      workExperienceId: "we-1",
    });
    const second = createBullet({
      text: "Reduje el tiempo de build en 40%",
      workExperienceId: "we-1",
    });

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
    expect(first.id).not.toBe(second.id);
  });

  it("asigna la fecha de creación al bullet creado", () => {
    const before = new Date();
    const bullet = createBullet({
      text: "Reduje el tiempo de build en 40%",
      workExperienceId: "we-1",
    });
    const after = new Date();

    expect(bullet.createdAt).toBeInstanceOf(Date);
    expect(bullet.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(bullet.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("asigna el workExperienceId dado al bullet creado", () => {
    const bullet = createBullet({
      text: "Reduje el tiempo de build en 40%",
      workExperienceId: "we-1",
    });

    expect(bullet.workExperienceId).toBe("we-1");
  });
});
