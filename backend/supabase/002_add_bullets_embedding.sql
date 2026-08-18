-- Migración: agrega la columna de embedding a bullets (RAG local, paso 4).
-- Correr a mano en el SQL Editor de Supabase.

create extension if not exists vector;

-- Nullable a propósito: no se hace backfill de bullets ya existentes sin
-- embedding (fuera de alcance) — createBullet siempre lo completa para
-- bullets nuevos, igual que pasa con id/created_at.
alter table bullets add column embedding vector(384);
