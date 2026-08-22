import { supabase } from "../supabase-client.js";
import type { SavedCV } from "./saved-cv.js";
import type { SavedCVRepository } from "./saved-cv-repository.js";

type SavedCVRow = {
  id: string;
  job_description_id: string;
  content: string;
  cover_letter_content: string;
  created_at: string;
};

function toDomain(row: SavedCVRow): SavedCV {
  return {
    id: row.id,
    jobDescriptionId: row.job_description_id,
    content: row.content,
    coverLetterContent: row.cover_letter_content,
    createdAt: new Date(row.created_at),
  };
}

function toRow(savedCV: SavedCV): SavedCVRow {
  return {
    id: savedCV.id,
    job_description_id: savedCV.jobDescriptionId,
    content: savedCV.content,
    cover_letter_content: savedCV.coverLetterContent,
    created_at: savedCV.createdAt.toISOString(),
  };
}

export class SavedCVRepositorySupabase implements SavedCVRepository {
  async create(savedCV: SavedCV, sessionId: string): Promise<SavedCV> {
    const { data, error } = await supabase
      .from("saved_cvs")
      .insert({ ...toRow(savedCV), session_id: sessionId })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear saved_cv: ${error.message}`);
    }

    return toDomain(data as SavedCVRow);
  }

  async findById(id: string, sessionId: string): Promise<SavedCV | undefined> {
    const { data, error } = await supabase
      .from("saved_cvs")
      .select()
      .eq("id", id)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al buscar saved_cv: ${error.message}`);
    }

    return data ? toDomain(data as SavedCVRow) : undefined;
  }

  async list(sessionId: string): Promise<SavedCV[]> {
    const { data, error } = await supabase.from("saved_cvs").select().eq("session_id", sessionId);

    if (error) {
      throw new Error(`Error al listar saved_cvs: ${error.message}`);
    }

    return (data as SavedCVRow[]).map(toDomain);
  }
}
