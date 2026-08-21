import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { createTestAppDependencies } from "../../__tests__/test-app-dependencies.js";
import type { CVParseResult } from "../cv-parse-result.js";
import type { LLMProvider } from "../../ports/llm-provider.js";

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
});
