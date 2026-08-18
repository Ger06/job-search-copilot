import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { WorkExperienceRepositorySupabase } from "../work-experience-repository-supabase.js";
import { supabase } from "../../supabase-client.js";

describe("WorkExperienceRepositorySupabase (integración)", () => {
  it("crea un work experience y lo lee de vuelta", async () => {
    const repository = new WorkExperienceRepositorySupabase();
    const created = await repository.create({
      id: randomUUID(),
      company: "Acme Corp",
      role: "Backend Engineer",
      startDate: new Date("2022-01-15"),
      order: 1,
    });

    try {
      const found = await repository.findById(created.id);

      expect(found).toEqual(created);
    } finally {
      await supabase.from("work_experiences").delete().eq("id", created.id);
    }
  });
});
