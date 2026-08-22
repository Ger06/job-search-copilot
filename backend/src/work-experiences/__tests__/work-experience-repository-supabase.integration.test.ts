import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { WorkExperienceRepositorySupabase } from "../work-experience-repository-supabase.js";
import { supabase } from "../../supabase-client.js";
import { TEST_SESSION_ID, OTHER_TEST_SESSION_ID } from "../../__tests__/test-app-dependencies.js";

describe("WorkExperienceRepositorySupabase (integración)", () => {
  it("crea un work experience y lo lee de vuelta", async () => {
    const repository = new WorkExperienceRepositorySupabase();
    const created = await repository.create(
      {
        id: randomUUID(),
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
    );

    try {
      const found = await repository.findById(created.id, TEST_SESSION_ID);

      expect(found).toEqual(created);
    } finally {
      await supabase.from("work_experiences").delete().eq("id", created.id);
    }
  });

  it("una sesión no puede leer un work experience creado por otra sesión", async () => {
    const repository = new WorkExperienceRepositorySupabase();
    const created = await repository.create(
      {
        id: randomUUID(),
        company: "Acme Corp",
        role: "Backend Engineer",
        startDate: new Date("2022-01-15"),
        order: 1,
      },
      TEST_SESSION_ID,
    );

    try {
      const found = await repository.findById(created.id, OTHER_TEST_SESSION_ID);

      expect(found).toBeUndefined();
    } finally {
      await supabase.from("work_experiences").delete().eq("id", created.id);
    }
  });
});
