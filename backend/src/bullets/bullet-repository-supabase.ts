import { supabase } from "../supabase-client.js";
import type { Bullet } from "./bullet.js";
import type { BulletRepository } from "./bullet-repository.js";

type BulletRow = {
  id: string;
  work_experience_id: string;
  text: string;
  created_at: string;
};

function toDomain(row: BulletRow): Bullet {
  return {
    id: row.id,
    text: row.text,
    workExperienceId: row.work_experience_id,
    createdAt: new Date(row.created_at),
  };
}

function toRow(bullet: Bullet): BulletRow {
  return {
    id: bullet.id,
    work_experience_id: bullet.workExperienceId,
    text: bullet.text,
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
}
