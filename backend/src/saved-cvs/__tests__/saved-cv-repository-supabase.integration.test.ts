import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SavedCVRepositorySupabase } from "../saved-cv-repository-supabase.js";
import { JobDescriptionRepositorySupabase } from "../../job-descriptions/job-description-repository-supabase.js";
import { supabase } from "../../supabase-client.js";

describe("SavedCVRepositorySupabase (integración)", () => {
  it("crea un SavedCV y lo lee de vuelta", async () => {
    const jobDescriptionRepository = new JobDescriptionRepositorySupabase();
    const jobDescription = await jobDescriptionRepository.create({
      id: randomUUID(),
      company: `Acme Corp ${randomUUID()}`,
      role: "Backend Engineer",
      rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      createdAt: new Date(),
    });

    const repository = new SavedCVRepositorySupabase();
    const created = await repository.create({
      id: randomUUID(),
      jobDescriptionId: jobDescription.id,
      content: "CV generado para Acme Corp",
      createdAt: new Date(),
    });

    try {
      const found = await repository.findById(created.id);

      expect(found).toEqual(created);
    } finally {
      await supabase.from("saved_cvs").delete().eq("id", created.id);
      await supabase.from("job_descriptions").delete().eq("id", jobDescription.id);
    }
  });
});
