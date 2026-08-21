import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { createJobDescription } from "../../job-descriptions/job-description-service.js";
import { createApplication } from "../application-service.js";
import { createTestAppDependencies } from "../../__tests__/test-app-dependencies.js";
import type { LLMProvider } from "../../ports/llm-provider.js";

function createFakeLLMProvider(firstCallContent: string): LLMProvider {
  let callIndex = 0;
  return {
    async generate() {
      const content = callIndex === 0 ? firstCallContent : "CONTENIDO DE LA COVER LETTER";
      callIndex += 1;
      return content;
    },
    async generateStructuredOutput() {
      throw new Error("no debería llamarse a generateStructuredOutput en este test");
    },
  };
}

async function setUpApp(overrides: Parameters<typeof createTestAppDependencies>[0] = {}) {
  const deps = createTestAppDependencies(overrides);
  const app = createApp(deps);
  const jobDescription = await createJobDescription(
    { company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer" },
    deps.jobDescriptionRepository,
  );
  return { app, deps, jobDescription };
}

describe("POST /applications", () => {
  it("crea una Application y devuelve 201 con status 'pendiente'", async () => {
    const { app, jobDescription } = await setUpApp();

    const response = await request(app).post("/applications").send({ jobDescriptionId: jobDescription.id });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ jobDescriptionId: jobDescription.id, status: "pendiente" });
  });

  it("devuelve 400 si falta jobDescriptionId", async () => {
    const { app } = await setUpApp();

    const response = await request(app).post("/applications").send({});

    expect(response.status).toBe(400);
  });

  it("devuelve 404 si el jobDescriptionId no existe", async () => {
    const { app } = await setUpApp();

    const response = await request(app).post("/applications").send({ jobDescriptionId: "no-existe" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
  });
});

describe("GET /applications", () => {
  it("devuelve 200 con todas las Application guardadas", async () => {
    const { app, jobDescription } = await setUpApp();
    await request(app).post("/applications").send({ jobDescriptionId: jobDescription.id });

    const response = await request(app).get("/applications");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });
});

describe("PATCH /applications/:id/status", () => {
  it("actualiza el status y devuelve 200", async () => {
    const { app, deps, jobDescription } = await setUpApp();
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      deps.applicationRepository,
      deps.jobDescriptionRepository,
      deps.savedCVRepository,
    );

    const response = await request(app).patch(`/applications/${application.id}/status`).send({ status: "enviada" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("enviada");
  });

  it("devuelve 400 si status no es uno de los valores válidos", async () => {
    const { app, deps, jobDescription } = await setUpApp();
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      deps.applicationRepository,
      deps.jobDescriptionRepository,
      deps.savedCVRepository,
    );

    const response = await request(app).patch(`/applications/${application.id}/status`).send({ status: "no-es-un-status" });

    expect(response.status).toBe(400);
  });

  it("devuelve 404 si la Application no existe", async () => {
    const { app } = await setUpApp();

    const response = await request(app).patch("/applications/no-existe/status").send({ status: "enviada" });

    expect(response.status).toBe(404);
  });
});

describe("PATCH /applications/:id/details", () => {
  it("actualiza solo los campos provistos y devuelve 200", async () => {
    const { app, deps, jobDescription } = await setUpApp();
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      deps.applicationRepository,
      deps.jobDescriptionRepository,
      deps.savedCVRepository,
    );

    const response = await request(app)
      .patch(`/applications/${application.id}/details`)
      .send({ recruiter: "Jane Doe" });

    expect(response.status).toBe(200);
    expect(response.body.recruiter).toBe("Jane Doe");
    expect(response.body.portal).toBeNull();
  });

  it("devuelve 400 si un campo presente no es string ni null", async () => {
    const { app, deps, jobDescription } = await setUpApp();
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      deps.applicationRepository,
      deps.jobDescriptionRepository,
      deps.savedCVRepository,
    );

    const response = await request(app).patch(`/applications/${application.id}/details`).send({ recruiter: 123 });

    expect(response.status).toBe(400);
  });

  it("devuelve 404 si la Application no existe", async () => {
    const { app } = await setUpApp();

    const response = await request(app).patch("/applications/no-existe/details").send({ recruiter: "Jane Doe" });

    expect(response.status).toBe(404);
  });
});

describe("GET /applications/export.csv", () => {
  it("devuelve 200 con Content-Type text/csv y el header esperado", async () => {
    const { app, jobDescription } = await setUpApp();
    await request(app).post("/applications").send({ jobDescriptionId: jobDescription.id });

    const response = await request(app).get("/applications/export.csv");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.text.split("\n")[0]).toBe(
      "id,company,role,status,recruiter,portal,salaryRequested,fitScore,notes,savedCvId,createdAt,updatedAt",
    );
  });
});

describe("POST /applications/:id/generate-cv", () => {
  it("genera el SavedCV, linkea savedCvId y devuelve 200 (sin WorkExperience, coverage trivial)", async () => {
    const llmProvider = createFakeLLMProvider("CONTENIDO DEL CV");
    const { app, deps, jobDescription } = await setUpApp({ llmProvider });
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      deps.applicationRepository,
      deps.jobDescriptionRepository,
      deps.savedCVRepository,
    );

    const response = await request(app).post(`/applications/${application.id}/generate-cv`);

    expect(response.status).toBe(200);
    expect(response.body.savedCvId).not.toBeNull();
  });

  it("devuelve 404 si la Application no existe", async () => {
    const { app } = await setUpApp();

    const response = await request(app).post("/applications/no-existe/generate-cv");

    expect(response.status).toBe(404);
  });

  it("devuelve 422 si el LLMProvider no cubre todas las WorkExperience (IncompleteCoverageError)", async () => {
    const llmProvider = createFakeLLMProvider("CONTENIDO DEL CV");
    const { app, deps, jobDescription } = await setUpApp({ llmProvider });
    await deps.workExperienceRepository.create({
      id: "we-1",
      company: "Beta Inc",
      role: "Software Engineer",
      startDate: new Date("2020-01-01"),
      order: 1,
    });
    const application = await createApplication(
      { jobDescriptionId: jobDescription.id },
      deps.applicationRepository,
      deps.jobDescriptionRepository,
      deps.savedCVRepository,
    );

    const response = await request(app).post(`/applications/${application.id}/generate-cv`);

    expect(response.status).toBe(422);
    expect(response.body.error).toBeDefined();
  });
});
