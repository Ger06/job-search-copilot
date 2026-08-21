import { supabase } from "../supabase-client.js";
import type { Application, ApplicationStatus } from "./application.js";
import type { ApplicationRepository } from "./application-repository.js";

type ApplicationRow = {
  id: string;
  job_description_id: string;
  saved_cv_id: string | null;
  status: ApplicationStatus;
  recruiter: string | null;
  portal: string | null;
  salary_requested: string | null;
  fit_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function toDomain(row: ApplicationRow): Application {
  return {
    id: row.id,
    jobDescriptionId: row.job_description_id,
    savedCvId: row.saved_cv_id,
    status: row.status,
    recruiter: row.recruiter,
    portal: row.portal,
    salaryRequested: row.salary_requested,
    fitScore: row.fit_score,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function toRow(application: Application): ApplicationRow {
  return {
    id: application.id,
    job_description_id: application.jobDescriptionId,
    saved_cv_id: application.savedCvId,
    status: application.status,
    recruiter: application.recruiter,
    portal: application.portal,
    salary_requested: application.salaryRequested,
    fit_score: application.fitScore,
    notes: application.notes,
    created_at: application.createdAt.toISOString(),
    updated_at: application.updatedAt.toISOString(),
  };
}

export class ApplicationRepositorySupabase implements ApplicationRepository {
  async create(application: Application): Promise<Application> {
    const { data, error } = await supabase.from("applications").insert(toRow(application)).select().single();

    if (error) {
      throw new Error(`Error al crear application: ${error.message}`);
    }

    return toDomain(data as ApplicationRow);
  }

  async findById(id: string): Promise<Application | undefined> {
    const { data, error } = await supabase.from("applications").select().eq("id", id).maybeSingle();

    if (error) {
      throw new Error(`Error al buscar application: ${error.message}`);
    }

    return data ? toDomain(data as ApplicationRow) : undefined;
  }

  async list(): Promise<Application[]> {
    const { data, error } = await supabase.from("applications").select();

    if (error) {
      throw new Error(`Error al listar applications: ${error.message}`);
    }

    return (data as ApplicationRow[]).map(toDomain);
  }

  async update(application: Application): Promise<Application> {
    const { data, error } = await supabase
      .from("applications")
      .update(toRow(application))
      .eq("id", application.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar application: ${error.message}`);
    }

    return toDomain(data as ApplicationRow);
  }
}
