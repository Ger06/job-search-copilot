import { supabase } from "../supabase-client.js";
import type { Bullet } from "./bullet.js";
import type { BulletRepository } from "./bullet-repository.js";

type BulletRow = {
  id: string;
  work_experience_id: string;
  text: string;
  embedding: string | number[];
  created_at: string;
};

// La columna `vector` de Supabase puede llegar como string ("[0.1,0.2,...]")
// o como array según la versión del cliente — se normaliza acá.
function parseEmbedding(embedding: string | number[]): number[] {
  return typeof embedding === "string" ? JSON.parse(embedding) : embedding;
}

function toDomain(row: BulletRow): Bullet {
  return {
    id: row.id,
    text: row.text,
    workExperienceId: row.work_experience_id,
    embedding: parseEmbedding(row.embedding),
    createdAt: new Date(row.created_at),
  };
}

function toRow(bullet: Bullet): BulletRow {
  return {
    id: bullet.id,
    work_experience_id: bullet.workExperienceId,
    text: bullet.text,
    embedding: bullet.embedding,
    created_at: bullet.createdAt.toISOString(),
  };
}

export class BulletRepositorySupabase implements BulletRepository {
  async create(bullet: Bullet): Promise<Bullet> {
    const { data, error } = await supabase.from("bullets").insert(toRow(bullet)).select().single();

    if (error) {
      throw new Error(`Error al crear bullet: ${error.message}`);
    }

    return toDomain(data as BulletRow);
  }

  async findById(id: string): Promise<Bullet | undefined> {
    const { data, error } = await supabase.from("bullets").select().eq("id", id).maybeSingle();

    if (error) {
      throw new Error(`Error al buscar bullet: ${error.message}`);
    }

    return data ? toDomain(data as BulletRow) : undefined;
  }

  async list(): Promise<Bullet[]> {
    const { data, error } = await supabase.from("bullets").select();

    if (error) {
      throw new Error(`Error al listar bullets: ${error.message}`);
    }

    return (data as BulletRow[]).map(toDomain);
  }

  async findByWorkExperienceId(workExperienceId: string): Promise<Bullet[]> {
    const { data, error } = await supabase
      .from("bullets")
      .select()
      .eq("work_experience_id", workExperienceId);

    if (error) {
      throw new Error(`Error al buscar bullets por work_experience_id: ${error.message}`);
    }

    return (data as BulletRow[]).map(toDomain);
  }
}
