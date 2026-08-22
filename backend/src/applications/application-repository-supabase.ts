import { supabase } from "../supabase-client.js";
import type { Application, ApplicationStatus } from "./application.js";
import type { ApplicationRepository } from "./application-repository.js";
import { NotFoundError } from "../errors/not-found-error.js";

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
  async create(application: Application, sessionId: string): Promise<Application> {
    const { data, error } = await supabase
      .from("applications")
      .insert({ ...toRow(application), session_id: sessionId })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear application: ${error.message}`);
    }

    return toDomain(data as ApplicationRow);
  }

  async findById(id: string, sessionId: string): Promise<Application | undefined> {
    const { data, error } = await supabase
      .from("applications")
      .select()
      .eq("id", id)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al buscar application: ${error.message}`);
    }

    return data ? toDomain(data as ApplicationRow) : undefined;
  }

  async list(sessionId: string): Promise<Application[]> {
    const { data, error } = await supabase.from("applications").select().eq("session_id", sessionId);

    if (error) {
      throw new Error(`Error al listar applications: ${error.message}`);
    }

    return (data as ApplicationRow[]).map(toDomain);
  }

  // .eq("session_id", sessionId) en el WHERE (nunca en el SET — session_id
  // es inmutable después de creada) es el enforcement real: si la fila no
  // existe o es de otra sesión, `data` vuelve null y tiramos NotFoundError
  // en vez de asumir que el update funcionó. No basta con que los callers
  // de application-service.ts ya hayan validado ownership vía findById
  // antes de llamar acá — este método se autoprotege igual, para que la
  // invariante sea cierta a nivel de repo, no solo por convención.
  async update(application: Application, sessionId: string): Promise<Application> {
    const { data, error } = await supabase
      .from("applications")
      .update(toRow(application))
      .eq("id", application.id)
      .eq("session_id", sessionId)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar application: ${error.message}`);
    }
    if (!data) {
      throw new NotFoundError("Application", application.id);
    }

    return toDomain(data as ApplicationRow);
  }
}
