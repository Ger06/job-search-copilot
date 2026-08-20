-- Migración: agrega cover_letter_content a saved_cvs (el agente, paso 5).
-- Correr a mano en el SQL Editor de Supabase.
-- Asume que saved_cvs no tiene filas reales todavía (solo filas de test,
-- que se borran en el finally de cada test de integración). Si ya tenés
-- datos reales ahí, avisá antes de correr esto para ajustar la migración
-- (agregar un default o hacer un backfill primero).

alter table saved_cvs add column cover_letter_content text not null;
