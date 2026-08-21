import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { createTestAppDependencies } from "../../__tests__/test-app-dependencies.js";
import { createWorkExperience } from "../../work-experiences/work-experience-service.js";
import type { CVParseResult } from "../cv-parse-result.js";
import type { LLMProvider } from "../../ports/llm-provider.js";

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__");
const fixturePath = (name: string) => path.join(fixturesDir, name);

const VALID_DRAFT: CVParseResult = {
  workExperiences: [
    {
      company: "Acme Corp",
      role: "Backend Engineer",
      startDate: "2020-01-01",
      endDate: null,
      bullets: [{ text: "Reduje el tiempo de build en 40%" }],
    },
  ],
};

function createFakeStructuredLLMProvider(response: string): LLMProvider {
  return {
    async generate() {
      throw new Error("no debería llamarse a generate en este test");
    },
    async generateStructuredOutput() {
      return response;
    },
  };
}

function setUpApp(llmProvider: LLMProvider) {
  const deps = createTestAppDependencies({ llmProvider });
  return { app: createApp(deps), deps };
}

describe("POST /cv-import/parse", () => {
  it("devuelve 200 con el borrador parseado, sin persistir nada", async () => {
    const { app, deps } = setUpApp(createFakeStructuredLLMProvider(JSON.stringify(VALID_DRAFT)));

    const response = await request(app).post("/cv-import/parse").send({ rawText: "un currículum de prueba" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(VALID_DRAFT);
    expect(await deps.workExperienceRepository.list()).toHaveLength(0);
  });

  it("devuelve 400 si falta rawText", async () => {
    const { app } = setUpApp(createFakeStructuredLLMProvider(JSON.stringify(VALID_DRAFT)));

    const response = await request(app).post("/cv-import/parse").send({});

    expect(response.status).toBe(400);
  });

  it("devuelve 422 si el LLM devuelve un borrador con un bullet vacío (MalformedCVParseError)", async () => {
    const invalidDraft: CVParseResult = {
      workExperiences: [
        {
          company: "Acme Corp",
          role: "Backend Engineer",
          startDate: "2020-01-01",
          endDate: null,
          bullets: [{ text: "   " }],
        },
      ],
    };
    const { app } = setUpApp(createFakeStructuredLLMProvider(JSON.stringify(invalidDraft)));

    const response = await request(app).post("/cv-import/parse").send({ rawText: "un currículum de prueba" });

    expect(response.status).toBe(422);
    expect(response.body.error).toBeDefined();
  });
});

describe("POST /cv-import/extract-text", () => {
  function setUpExtractApp() {
    return createApp(createTestAppDependencies());
  }

  it("sube un PDF real y devuelve 200 con el texto extraído", async () => {
    const app = setUpExtractApp();

    const response = await request(app).post("/cv-import/extract-text").attach("file", fixturePath("sample-cv.pdf"));

    expect(response.status).toBe(200);
    expect(response.body.text).toContain("Beta Inc - Backend Engineer - 2020 a 2022");
  });

  it("devuelve 400 si no se adjunta ningún archivo", async () => {
    const app = setUpExtractApp();

    const response = await request(app).post("/cv-import/extract-text");

    expect(response.status).toBe(400);
  });

  it("devuelve 400 si el archivo tiene una extensión no soportada", async () => {
    const app = setUpExtractApp();

    const response = await request(app)
      .post("/cv-import/extract-text")
      .attach("file", Buffer.from("hola"), "cv.txt");

    expect(response.status).toBe(400);
  });

  it("devuelve 422 si no se puede extraer texto útil del archivo (FileExtractionError)", async () => {
    const app = setUpExtractApp();

    const response = await request(app).post("/cv-import/extract-text").attach("file", fixturePath("empty.pdf"));

    expect(response.status).toBe(422);
    expect(response.body.error).toBeDefined();
  });

  it("devuelve 400 si el archivo supera el límite de tamaño", async () => {
    const app = setUpExtractApp();
    const oversized = Buffer.alloc(6 * 1024 * 1024, "a");

    const response = await request(app).post("/cv-import/extract-text").attach("file", oversized, "big.pdf");

    expect(response.status).toBe(400);
  });
});

describe("POST /cv-import/confirm", () => {
  it("persiste el borrador y devuelve 201 con las entidades reales creadas", async () => {
    const { app, deps } = setUpApp(createFakeStructuredLLMProvider(""));

    const response = await request(app).post("/cv-import/confirm").send(VALID_DRAFT);

    expect(response.status).toBe(201);
    expect(response.body.workExperiences).toHaveLength(1);
    expect(response.body.bullets).toHaveLength(1);
    expect(await deps.workExperienceRepository.list()).toHaveLength(1);
  });

  it("devuelve 400 si el borrador tiene un shape inválido", async () => {
    const { app } = setUpApp(createFakeStructuredLLMProvider(""));

    const response = await request(app).post("/cv-import/confirm").send({ workExperiences: "no-es-un-array" });

    expect(response.status).toBe(400);
  });

  it("devuelve 409 si el borrador incluye una WorkExperience que ya existe (mismo company, role y startDate)", async () => {
    const { app, deps } = setUpApp(createFakeStructuredLLMProvider(""));
    await createWorkExperience(
      { company: "Acme Corp", role: "Backend Engineer", startDate: new Date("2020-01-01"), order: 1 },
      deps.workExperienceRepository,
    );

    const response = await request(app).post("/cv-import/confirm").send(VALID_DRAFT);

    expect(response.status).toBe(409);
    expect(response.body.error).toBeDefined();
    expect(await deps.workExperienceRepository.list()).toHaveLength(1);
  });
});
