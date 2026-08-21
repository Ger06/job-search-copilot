import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { createTestAppDependencies } from "../../__tests__/test-app-dependencies.js";
import { createJobDescription } from "../../job-descriptions/job-description-service.js";
import { createSavedCV } from "../saved-cv-service.js";

function setUpApp() {
  const deps = createTestAppDependencies();
  return { app: createApp(deps), deps };
}

describe("GET /saved-cvs/:id", () => {
  it("devuelve 200 con el SavedCV cuando existe", async () => {
    const { app, deps } = setUpApp();
    const jobDescription = await createJobDescription(
      { company: "Acme Corp", role: "Backend Engineer", rawText: "Buscamos un Backend Engineer" },
      deps.jobDescriptionRepository,
    );
    const savedCV = await createSavedCV(
      { jobDescriptionId: jobDescription.id, content: "CV generado", coverLetterContent: "Carta generada" },
      deps.savedCVRepository,
      deps.jobDescriptionRepository,
    );

    const response = await request(app).get(`/saved-cvs/${savedCV.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: savedCV.id,
      content: "CV generado",
      coverLetterContent: "Carta generada",
    });
  });

  it("devuelve 404 si el id no existe", async () => {
    const { app } = setUpApp();

    const response = await request(app).get("/saved-cvs/no-existe");

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
  });
});
