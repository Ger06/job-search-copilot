import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BulletRepositorySupabase } from "../bullet-repository-supabase.js";
import { WorkExperienceRepositorySupabase } from "../../work-experiences/work-experience-repository-supabase.js";
import { supabase } from "../../supabase-client.js";

describe("BulletRepositorySupabase (integración)", () => {
  it("crea un bullet y lo lee de vuelta", async () => {
    const workExperienceRepository = new WorkExperienceRepositorySupabase();
    const workExperience = await workExperienceRepository.create({
      id: randomUUID(),
      company: "Acme Corp",
      role: "Backend Engineer",
      startDate: new Date("2022-01-15"),
      order: 1,
    });

    const repository = new BulletRepositorySupabase();
    const created = await repository.create({
      id: randomUUID(),
      text: "Corriste en floresta",
      workExperienceId: workExperience.id,
      createdAt: new Date(),
    });

    try {
      const found = await repository.findById(created.id);

      expect(found).toEqual(created);
    } finally {
      await supabase.from("bullets").delete().eq("id", created.id);
      await supabase.from("work_experiences").delete().eq("id", workExperience.id);
    }
  });
});
