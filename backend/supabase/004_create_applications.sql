-- Migración: crea la tabla applications (tracker de postulaciones, paso 6).
-- Correr a mano en el SQL Editor de Supabase.

create table applications (
  id uuid primary key default gen_random_uuid(),
  job_description_id uuid not null references job_descriptions (id),
  saved_cv_id uuid references saved_cvs (id),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'enviada', 'entrevista', 'rechazada', 'oferta')),
  recruiter text,
  portal text,
  salary_requested text,
  fit_score double precision,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table applications enable row level security;
