import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { JobDescriptionRepositorySupabase } from "../job-description-repository-supabase.js";
import { supabase } from "../../supabase-client.js";

describe("JobDescriptionRepositorySupabase (integración)", () => {
  it("crea una JobDescription, la lee de vuelta y la encuentra por company y role", async () => {
    const company = `Acme Corp ${randomUUID()}`;
    const repository = new JobDescriptionRepositorySupabase();
    const created = await repository.create({
      id: randomUUID(),
      company,
      role: "Backend Engineer",
      rawText: "Buscamos un Backend Engineer con experiencia en Node.js",
      createdAt: new Date(),
    });

    try {
      const found = await repository.findById(created.id);
      expect(found).toEqual(created);

      const foundByCompanyAndRole = await repository.findByCompanyAndRole(
        ` ${company.toUpperCase()} `,
        " backend engineer",
      );
      expect(foundByCompanyAndRole).toEqual(created);
    } finally {
      await supabase.from("job_descriptions").delete().eq("id", created.id);
    }
  });
});
