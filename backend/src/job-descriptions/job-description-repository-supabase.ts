import { supabase } from "../supabase-client.js";
import type { JobDescription } from "./job-description.js";
import type { JobDescriptionRepository } from "./job-description-repository.js";

type JobDescriptionRow = {
  id: string;
  company: string;
  role: string;
  raw_text: string;
  created_at: string;
};

function toDomain(row: JobDescriptionRow): JobDescription {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    rawText: row.raw_text,
    createdAt: new Date(row.created_at),
  };
}

function toRow(jobDescription: JobDescription): JobDescriptionRow {
  return {
    id: jobDescription.id,
    company: jobDescription.company,
    role: jobDescription.role,
    raw_text: jobDescription.rawText,
    created_at: jobDescription.createdAt.toISOString(),
  };
}

export class JobDescriptionRepositorySupabase implements JobDescriptionRepository {
  async create(jobDescription: JobDescription): Promise<JobDescription> {
    const { data, error } = await supabase
      .from("job_descriptions")
      .insert(toRow(jobDescription))
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear job_description: ${error.message}`);
    }

    return toDomain(data as JobDescriptionRow);
  }

  async findById(id: string): Promise<JobDescription | undefined> {
    const { data, error } = await supabase
      .from("job_descriptions")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al buscar job_description: ${error.message}`);
    }

    return data ? toDomain(data as JobDescriptionRow) : undefined;
  }

  async list(): Promise<JobDescription[]> {
    const { data, error } = await supabase.from("job_descriptions").select();

    if (error) {
      throw new Error(`Error al listar job_descriptions: ${error.message}`);
    }

    return (data as JobDescriptionRow[]).map(toDomain);
  }

  async findByCompanyAndRole(company: string, role: string): Promise<JobDescription | undefined> {
    const normalizedCompany = company.trim().toLowerCase();
    const normalizedRole = role.trim().toLowerCase();

    const all = await this.list();

    return all.find(
      (jd) =>
        jd.company.trim().toLowerCase() === normalizedCompany &&
        jd.role.trim().toLowerCase() === normalizedRole,
    );
  }
}
