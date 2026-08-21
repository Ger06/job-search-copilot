import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { createTestAppDependencies } from "../../__tests__/test-app-dependencies.js";

function setUpApp() {
  const deps = createTestAppDependencies();
  return { app: createApp(deps), deps };
}

describe("POST /job-descriptions", () => {
  it("crea una JobDescription y devuelve 201 con la entidad creada", async () => {
    const { app } = setUpApp();

    const response = await request(app)
      .post("/job-descriptions")
      .send({ company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ company: "Acme Corp", role: "Backend Engineer" });
  });

  it("devuelve 400 si falta un campo requerido", async () => {
    const { app } = setUpApp();

    const response = await request(app).post("/job-descriptions").send({ company: "Acme Corp", role: "Backend Engineer" });

    expect(response.status).toBe(400);
  });

  it("devuelve 409 si ya existe una JobDescription con la misma company y role", async () => {
    const { app } = setUpApp();
    await request(app)
      .post("/job-descriptions")
      .send({ company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer" });

    const response = await request(app)
      .post("/job-descriptions")
      .send({ company: "Acme Corp", role: "Backend Engineer", rawText: "Otro texto" });

    expect(response.status).toBe(409);
    expect(response.body.error).toBeDefined();
  });
});

describe("GET /job-descriptions", () => {
  it("devuelve 200 con todas las JobDescription guardadas", async () => {
    const { app } = setUpApp();
    await request(app)
      .post("/job-descriptions")
      .send({ company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer" });

    const response = await request(app).get("/job-descriptions");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });
});
