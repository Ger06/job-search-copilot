-- Aislamiento de datos por sesión (X-Session-Id), NO autenticación real.
-- Ver "Limitaciones conocidas" en CLAUDE.md. Se pierden los datos
-- existentes: no hay backfill, se recrean las tablas desde cero.
-- RLS queda habilitado sin políticas (igual que antes) pero es inerte:
-- el backend solo usa la service-role key, que ignora RLS siempre. El
-- aislamiento se aplica enteramente en la capa de repositorios de Node,
-- no en Postgres.
-- Correr a mano en el SQL Editor de Supabase.

create extension if not exists vector;

drop table if exists applications, saved_cvs, bullets, job_descriptions, work_experiences cascade;

create table work_experiences (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  company text not null,
  role text not null,
  start_date date not null,
  end_date date,
  "order" integer not null
);
create index work_experiences_session_id_idx on work_experiences (session_id);

create table job_descriptions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  company text not null,
  role text not null,
  raw_text text not null,
  created_at timestamptz not null default now()
);
create index job_descriptions_session_id_idx on job_descriptions (session_id);
create unique index job_descriptions_company_role_unique_idx
  on job_descriptions (session_id, lower(trim(company)), lower(trim(role)));

create table bullets (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  work_experience_id uuid not null references work_experiences (id),
  text text not null,
  embedding vector(384),
  created_at timestamptz not null default now()
);
create index bullets_session_id_idx on bullets (session_id);

create table saved_cvs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  job_description_id uuid not null references job_descriptions (id),
  content text not null,
  cover_letter_content text not null,
  created_at timestamptz not null default now()
);
create index saved_cvs_session_id_idx on saved_cvs (session_id);

create table applications (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
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
create index applications_session_id_idx on applications (session_id);

alter table work_experiences enable row level security;
alter table bullets enable row level security;
alter table job_descriptions enable row level security;
alter table saved_cvs enable row level security;
alter table applications enable row level security;
