import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ApplicationRepositorySupabase } from "../application-repository-supabase.js";
import { JobDescriptionRepositorySupabase } from "../../job-descriptions/job-description-repository-supabase.js";
import { supabase } from "../../supabase-client.js";
import { NotFoundError } from "../../errors/not-found-error.js";
import { TEST_SESSION_ID, OTHER_TEST_SESSION_ID } from "../../__tests__/test-app-dependencies.js";

describe("ApplicationRepositorySupabase (integración)", () => {
  it("crea una Application, la lee, la actualiza (status) y confirma el cambio persistido", async () => {
    const jobDescriptionRepository = new JobDescriptionRepositorySupabase();
    const jobDescription = await jobDescriptionRepository.create(
      {
        id: randomUUID(),
        company: `Acme Corp ${randomUUID()}`,
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
        createdAt: new Date(),
      },
      TEST_SESSION_ID,
    );

    const repository = new ApplicationRepositorySupabase();
    const now = new Date();
    const created = await repository.create(
      {
        id: randomUUID(),
        jobDescriptionId: jobDescription.id,
        savedCvId: null,
        status: "pendiente",
        recruiter: null,
        portal: null,
        salaryRequested: null,
        fitScore: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
      },
      TEST_SESSION_ID,
    );

    try {
      const found = await repository.findById(created.id, TEST_SESSION_ID);
      expect(found).toEqual(created);

      const updated = await repository.update({ ...created, status: "enviada", updatedAt: new Date() }, TEST_SESSION_ID);
      expect(updated.status).toBe("enviada");

      const foundAfterUpdate = await repository.findById(created.id, TEST_SESSION_ID);
      expect(foundAfterUpdate?.status).toBe("enviada");
    } finally {
      await supabase.from("applications").delete().eq("id", created.id);
      await supabase.from("job_descriptions").delete().eq("id", jobDescription.id);
    }
  });

  // Mismo enforcement que el test in-memory, esta vez contra la Supabase
  // real: un update() con el sessionId de otra sesión debe fallar con
  // NotFoundError (el WHERE .eq("session_id", ...) no matchea ninguna
  // fila) y no debe modificar nada.
  it("lanza NotFoundError si se intenta actualizar una Application con el sessionId de otra sesión", async () => {
    const jobDescriptionRepository = new JobDescriptionRepositorySupabase();
    const jobDescription = await jobDescriptionRepository.create(
      {
        id: randomUUID(),
        company: `Acme Corp ${randomUUID()}`,
        role: "Backend Engineer",
        rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
        createdAt: new Date(),
      },
      TEST_SESSION_ID,
    );

    const repository = new ApplicationRepositorySupabase();
    const now = new Date();
    const created = await repository.create(
      {
        id: randomUUID(),
        jobDescriptionId: jobDescription.id,
        savedCvId: null,
        status: "pendiente",
        recruiter: null,
        portal: null,
        salaryRequested: null,
        fitScore: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
      },
      TEST_SESSION_ID,
    );

    try {
      await expect(
        repository.update({ ...created, status: "oferta", updatedAt: new Date() }, OTHER_TEST_SESSION_ID),
      ).rejects.toThrow(new NotFoundError("Application", created.id));

      const stillOriginal = await repository.findById(created.id, TEST_SESSION_ID);
      expect(stillOriginal?.status).toBe("pendiente");
    } finally {
      await supabase.from("applications").delete().eq("id", created.id);
      await supabase.from("job_descriptions").delete().eq("id", jobDescription.id);
    }
  });
});
