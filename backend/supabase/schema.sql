-- Job Search Copilot — schema para las 4 entidades del backend.
-- Correr a mano en el SQL Editor de Supabase.

create table work_experiences (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  role text not null,
  start_date date not null,
  end_date date,
  "order" integer not null
);

create table bullets (
  id uuid primary key default gen_random_uuid(),
  work_experience_id uuid not null references work_experiences (id),
  text text not null,
  created_at timestamptz not null default now()
);

create table job_descriptions (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  role text not null,
  raw_text text not null,
  created_at timestamptz not null default now()
);

-- Postgres no permite expresiones (lower/trim) en un UNIQUE constraint de
-- tabla, así que la regla de "no duplicar company+role salvo mayúsculas y
-- espacios" (ya implementada a nivel de aplicación) se refleja acá como un
-- índice único sobre esas expresiones — es la forma correcta de lograrlo.
create unique index job_descriptions_company_role_unique_idx
  on job_descriptions (lower(trim(company)), lower(trim(role)));

create table saved_cvs (
  id uuid primary key default gen_random_uuid(),
  job_description_id uuid not null references job_descriptions (id),
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS habilitado sin políticas = deniega todo por default para anon/
-- authenticated. El backend usa SUPABASE_SERVICE_ROLE_KEY, que ignora RLS
-- siempre, así que esto no afecta su acceso — solo cierra el acceso directo
-- desde el browser (ej. si el frontend llega a usar la anon key) hasta que
-- se agreguen políticas explícitas.
alter table work_experiences enable row level security;
alter table bullets enable row level security;
alter table job_descriptions enable row level security;
alter table saved_cvs enable row level security;
