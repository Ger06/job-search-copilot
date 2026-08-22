import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import { createTestAppDependencies, sessionRequest, TEST_SESSION_ID } from "../../__tests__/test-app-dependencies.js";

async function setUpApp() {
  const deps = createTestAppDependencies();
  const app = createApp(deps);
  const workExperience = await createWorkExperience(
    { company: "Acme Corp", role: "Backend Engineer", startDate: new Date("2020-01-01"), order: 1 },
    TEST_SESSION_ID,
    deps.workExperienceRepository,
  );
  return { app, workExperience };
}

describe("POST /bullets", () => {
  it("crea un Bullet y devuelve 201 con la entidad creada", async () => {
    const { app, workExperience } = await setUpApp();

    const response = await sessionRequest(app)
      .post("/bullets")
      .send({ text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id });
  });

  it("devuelve 400 si falta un campo requerido", async () => {
    const { app } = await setUpApp();

    const response = await sessionRequest(app).post("/bullets").send({ text: "Reduje el tiempo de build en 40%" });

    expect(response.status).toBe(400);
  });

  it("devuelve 404 si el workExperienceId no existe", async () => {
    const { app } = await setUpApp();

    const response = await sessionRequest(app)
      .post("/bullets")
      .send({ text: "Reduje el tiempo de build en 40%", workExperienceId: "no-existe" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
  });

  it("devuelve 404 si el workExperienceId existe pero es de otra sesión", async () => {
    const { app, workExperience } = await setUpApp();

    const response = await request(app)
      .post("/bullets")
      .set("X-Session-Id", "otra-sesion")
      .send({ text: "Bullet intruso", workExperienceId: workExperience.id });

    expect(response.status).toBe(404);
  });
});

describe("GET /bullets", () => {
  it("devuelve 200 con todos los Bullet guardados en esa sesión", async () => {
    const { app, workExperience } = await setUpApp();
    await sessionRequest(app)
      .post("/bullets")
      .send({ text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id });

    const response = await sessionRequest(app).get("/bullets");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it("una sesión no ve los Bullet creados por otra sesión", async () => {
    const { app, workExperience } = await setUpApp();
    await sessionRequest(app)
      .post("/bullets")
      .send({ text: "Reduje el tiempo de build en 40%", workExperienceId: workExperience.id });

    const response = await request(app).get("/bullets").set("X-Session-Id", "otra-sesion");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
