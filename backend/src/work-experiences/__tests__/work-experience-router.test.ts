import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { createTestAppDependencies, sessionRequest } from "../../__tests__/test-app-dependencies.js";

function setUpApp() {
  const deps = createTestAppDependencies();
  return { app: createApp(deps), deps };
}

describe("POST /work-experiences", () => {
  it("crea una WorkExperience y devuelve 201 con la entidad creada", async () => {
    const { app } = setUpApp();

    const response = await sessionRequest(app)
      .post("/work-experiences")
      .send({ company: "Acme Corp", role: "Backend Engineer", startDate: "2020-01-01", order: 1 });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ company: "Acme Corp", role: "Backend Engineer", order: 1 });
    expect(response.body.id).toBeDefined();
  });

  it("devuelve 400 si falta un campo requerido", async () => {
    const { app } = setUpApp();

    const response = await sessionRequest(app).post("/work-experiences").send({ role: "Backend Engineer", order: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it("devuelve 400 si falta el header X-Session-Id", async () => {
    const { app } = setUpApp();

    const response = await request(app)
      .post("/work-experiences")
      .send({ company: "Acme Corp", role: "Backend Engineer", startDate: "2020-01-01", order: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});

describe("GET /work-experiences", () => {
  it("devuelve 200 con todas las WorkExperience guardadas en esa sesión", async () => {
    const { app } = setUpApp();
    await sessionRequest(app)
      .post("/work-experiences")
      .send({ company: "Acme Corp", role: "Backend Engineer", startDate: "2020-01-01", order: 1 });

    const response = await sessionRequest(app).get("/work-experiences");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].company).toBe("Acme Corp");
  });

  it("una sesión no ve las WorkExperience creadas por otra sesión", async () => {
    const { app } = setUpApp();
    await sessionRequest(app)
      .post("/work-experiences")
      .send({ company: "Acme Corp", role: "Backend Engineer", startDate: "2020-01-01", order: 1 });

    const response = await request(app).get("/work-experiences").set("X-Session-Id", "otra-sesion");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
