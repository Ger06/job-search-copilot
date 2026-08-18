# Job Search Copilot

App que tailorea CVs y cover letters para búsquedas laborales, usando un
"bullet bank" propio como fuente de verdad para retrieval (RAG).

## Estructura

- `frontend/` — Next.js + TypeScript
- `backend/` — Express + TypeScript

## Stack

- Monorepo, npm workspaces
- Next.js + TypeScript (frontend)
- Express + TypeScript (backend)
- Supabase (Postgres + pgvector)
- Supabase Auth
- Groq (LLM)
- Vitest (testing)

## Reglas del proyecto

- Ports & Adapters: la lógica de negocio nunca importa el SDK de Groq ni el
  cliente de Supabase directamente. Siempre a través de interfaces
  `LLMProvider`, `VectorStore` y `EmbeddingProvider` definidas en
  `backend/src/ports/`.
- Backend organizado por entidad (`backend/src/<entidad>/`). Cada función de
  `*-service.ts` tiene su test en el `__tests__/` de esa misma carpeta, usando
  Vitest (no Jest).
- Cada entidad expone su acceso a datos vía una interfaz `*Repository`, con
  implementación in-memory (para tests) y una implementación Supabase real.
  Los tests de servicios usan siempre el repo in-memory, nunca Supabase real.
- Nombres de archivo en kebab-case. Componentes React en PascalCase.

Reglas no negociables (una página, cero métricas inventadas, tests deben
pasar antes de commit) están enforced por hooks, no reescribir acá — ver
`.claude/hooks/`.
