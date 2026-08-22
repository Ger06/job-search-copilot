import { supabase } from "../supabase-client.js";
import type { WorkExperience } from "./work-experience.js";
import type { WorkExperienceRepository } from "./work-experience-repository.js";

type WorkExperienceRow = {
  id: string;
  company: string;
  role: string;
  start_date: string;
  end_date: string | null;
  order: number;
};

function toDomain(row: WorkExperienceRow): WorkExperience {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    startDate: new Date(row.start_date),
    ...(row.end_date !== null ? { endDate: new Date(row.end_date) } : {}),
    order: row.order,
  };
}

function toRow(workExperience: WorkExperience): WorkExperienceRow {
  return {
    id: workExperience.id,
    company: workExperience.company,
    role: workExperience.role,
    start_date: workExperience.startDate.toISOString(),
    end_date: workExperience.endDate !== undefined ? workExperience.endDate.toISOString() : null,
    order: workExperience.order,
  };
}

export class WorkExperienceRepositorySupabase implements WorkExperienceRepository {
  async create(workExperience: WorkExperience, sessionId: string): Promise<WorkExperience> {
    const { data, error } = await supabase
      .from("work_experiences")
      .insert({ ...toRow(workExperience), session_id: sessionId })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear work_experience: ${error.message}`);
    }

    return toDomain(data as WorkExperienceRow);
  }

  async findById(id: string, sessionId: string): Promise<WorkExperience | undefined> {
    const { data, error } = await supabase
      .from("work_experiences")
      .select()
      .eq("id", id)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al buscar work_experience: ${error.message}`);
    }

    return data ? toDomain(data as WorkExperienceRow) : undefined;
  }

  async list(sessionId: string): Promise<WorkExperience[]> {
    const { data, error } = await supabase.from("work_experiences").select().eq("session_id", sessionId);

    if (error) {
      throw new Error(`Error al listar work_experiences: ${error.message}`);
    }

    return (data as WorkExperienceRow[]).map(toDomain);
  }
}
