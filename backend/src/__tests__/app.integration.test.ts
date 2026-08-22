import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { WorkExperienceRepositorySupabase } from "../work-experiences/work-experience-repository-supabase.js";
import { BulletRepositorySupabase } from "../bullets/bullet-repository-supabase.js";
import { JobDescriptionRepositorySupabase } from "../job-descriptions/job-description-repository-supabase.js";
import { SavedCVRepositorySupabase } from "../saved-cvs/saved-cv-repository-supabase.js";
import { ApplicationRepositorySupabase } from "../applications/application-repository-supabase.js";
import { supabase } from "../supabase-client.js";
import { createFakeEmbeddingProvider, createUnusedLLMProvider, TEST_SESSION_ID } from "./test-app-dependencies.js";

describe("app (integración, Supabase real)", () => {
  it("POST /work-experiences seguido de GET /work-experiences funciona de punta a punta contra Supabase real", async () => {
    const app = createApp({
      workExperienceRepository: new WorkExperienceRepositorySupabase(),
      bulletRepository: new BulletRepositorySupabase(),
      jobDescriptionRepository: new JobDescriptionRepositorySupabase(),
      savedCVRepository: new SavedCVRepositorySupabase(),
      applicationRepository: new ApplicationRepositorySupabase(),
      embeddingProvider: createFakeEmbeddingProvider(),
      llmProvider: createUnusedLLMProvider(),
    });

    const createResponse = await request(app)
      .post("/work-experiences")
      .set("X-Session-Id", TEST_SESSION_ID)
      .send({ company: `Smoke Test Co ${Date.now()}`, role: "QA Engineer", startDate: "2020-01-01", order: 1 });

    try {
      expect(createResponse.status).toBe(201);
      const createdId = createResponse.body.id as string;

      const listResponse = await request(app).get("/work-experiences").set("X-Session-Id", TEST_SESSION_ID);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.some((we: { id: string }) => we.id === createdId)).toBe(true);
    } finally {
      await supabase.from("work_experiences").delete().eq("id", createResponse.body.id);
    }
  });
});
