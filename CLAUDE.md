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
  `LLMProvider` y `VectorStore` definidas en `backend/src/ports/`.
- Cada función en `services/` tiene su test en `services/__tests__/`, usando
  Vitest (no Jest).
- Nombres de archivo en kebab-case. Componentes React en PascalCase.

Reglas no negociables (una página, cero métricas inventadas, tests deben
pasar antes de commit) están enforced por hooks, no reescribir acá — ver
`.claude/hooks/`.
