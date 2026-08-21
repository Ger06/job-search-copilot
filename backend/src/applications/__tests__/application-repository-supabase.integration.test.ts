import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ApplicationRepositorySupabase } from "../application-repository-supabase.js";
import { JobDescriptionRepositorySupabase } from "../../job-descriptions/job-description-repository-supabase.js";
import { supabase } from "../../supabase-client.js";

describe("ApplicationRepositorySupabase (integración)", () => {
  it("crea una Application, la lee, la actualiza (status) y confirma el cambio persistido", async () => {
    const jobDescriptionRepository = new JobDescriptionRepositorySupabase();
    const jobDescription = await jobDescriptionRepository.create({
      id: randomUUID(),
      company: `Acme Corp ${randomUUID()}`,
      role: "Backend Engineer",
      rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      createdAt: new Date(),
    });

    const repository = new ApplicationRepositorySupabase();
    const now = new Date();
    const created = await repository.create({
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
    });

    try {
      const found = await repository.findById(created.id);
      expect(found).toEqual(created);

      const updated = await repository.update({ ...created, status: "enviada", updatedAt: new Date() });
      expect(updated.status).toBe("enviada");

      const foundAfterUpdate = await repository.findById(created.id);
      expect(foundAfterUpdate?.status).toBe("enviada");
    } finally {
      await supabase.from("applications").delete().eq("id", created.id);
      await supabase.from("job_descriptions").delete().eq("id", jobDescription.id);
    }
  });
});
