---
name: agent-prompts
description: Usar cuando se pida crear o modificar cualquier prompt para el agente de CV/cover letter (CV_AGENT_SYSTEM_PROMPT u otros futuros), o agregar un nuevo tipo de contenido generado por LLM al proyecto (ej. un nuevo documento, un nuevo campo redactado por el modelo). Aplica las reglas no negociables de honestidad del proyecto, el patrón de prompt-como-constante, el requisito de eval antes de dar por terminado, y el guardrail anti-datos-inventados.
---

# Agent Prompts

## Para qué sirve

Job Search Copilot usa un LLM (Groq, vía `LLMProvider`) para generar
contenido sobre una persona real — su CV, su cover letter, y en el
futuro probablemente más (ej. respuestas a preguntas de aplicación,
mensajes de outreach). El riesgo central de este tipo de contenido es
que el modelo invente cosas: métricas, logros, tecnologías, o incluso
identidad y datos de contacto que no existen en los datos reales del
usuario. Esta skill existe para que cualquier prompt nuevo o modificado
del agente pase por las mismas protecciones que ya se armaron y
validaron (con varias iteraciones reales contra Groq) para
`CV_AGENT_SYSTEM_PROMPT`, en vez de reinventarlas a medias cada vez.

Se activa cuando se pida crear o modificar un prompt del agente, o sumar
un nuevo tipo de contenido generado por LLM.

## Reglas no negociables

1. **Nunca debilitar ni remover la instrucción anti-fabricación.** Todo
   prompt del agente tiene que prohibir explícitamente:
   - inventar o exagerar métricas, logros o tecnologías no presentes en
     los bullets fuente (la regla de honestidad original del proyecto,
     documentada también en `saved-cv-service.ts`);
   - inventar identidad o datos de contacto (nombre, email, teléfono,
     LinkedIn) — esto se agregó después de que un eval real detectara al
     modelo inventando un teléfono y una universidad completa cuando no
     tenía esos datos;
   - calcular o inferir números que no aparecen literalmente en los
     datos fuente (ej. "años de experiencia" calculado a partir de
     fechas) — también agregado tras un eval real.

   Si se está modificando un prompt existente, releer
   `backend/src/cv-agent/cv-agent-system-prompt.ts` antes de tocarlo:
   cada párrafo de ese prompt está ahí por un motivo concreto que salió
   de un eval fallido, no es redacción arbitraria.

2. **El system prompt va como constante nombrada en su propio archivo,
   nunca hardcodeado inline.** Mismo patrón que
   `cv-agent-system-prompt.ts`: un archivo por prompt, exportando una
   constante en `SCREAMING_SNAKE_CASE`, con un comentario arriba
   explicando qué regla de negocio encierra. El servicio que arma los
   mensajes (`cv-agent-service.ts`) solo importa la constante, nunca
   define texto de prompt propio inline.

3. **Ningún prompt nuevo o modificado se da por terminado sin al menos
   un test de integración tipo eval.** Un eval de prompt no compara
   texto exacto (el LLM no es determinista) — verifica propiedades:
   - cobertura (¿se usó toda la información esperada, sin omitir nada?);
   - ausencia de datos inventados (¿todo dato verificable en el output
     aparece en la fuente real que se le dio al modelo?);
   - sanidad estructural (¿el output no está vacío, es distinto de otros
     campos relacionados, etc.?).

   Mirar `backend/src/cv-agent/__tests__/cv-agent.integration.test.ts`
   como referencia concreta: ahí están las evals que se usan para
   `generateTailoredCV` (cobertura de WorkExperience, números no
   inventados, sanidad estructural, persistencia), incluyendo el
   criterio de qué contar como "fuente permitida" para no generar falsos
   positivos (ver el comentario sobre `allowedSource` en ese archivo).
   Van en `test:integration`, nunca en `test:unit` — dependen de Groq
   real y tienen latencia/costo.

4. **Si el contenido nuevo puede incluir datos sensibles inventables
   (identidad, contacto), necesita un guardrail real antes de
   persistir — no alcanza con el prompt.** Los evals mostraron que el
   prompt solo no es 100% confiable. `validateNoFabricatedContactInfo`
   (`backend/src/cv-agent/validate-no-fabricated-contact-info.ts`) es el
   guardrail existente para email/teléfono — reusarlo si aplica, o si el
   nuevo contenido tiene un riesgo de fabricación distinto, escribir un
   guardrail equivalente (función pura, sin dependencias de LLM/repos,
   que lanza un error de dominio — mismo patrón que
   `FabricatedContentError` en `backend/src/errors/`) y llamarlo desde el
   servicio de orquestación antes de la persistencia, nunca después.

## Ejemplo concreto a imitar

Para ver las cuatro reglas juntas en un caso real, mirar en orden:

1. `backend/src/cv-agent/cv-agent-system-prompt.ts` — el prompt en sí,
   constante nombrada, con la regla de honestidad completa.
2. `backend/src/cv-agent/validate-no-fabricated-contact-info.ts` — el
   guardrail de código que corre además del prompt.
3. `backend/src/cv-agent/cv-agent-service.ts` — cómo se conectan: el
   prompt se usa para generar contenido, el guardrail corre antes de
   persistir (`validateNoFabricatedContactInfo(content)` antes de
   `createSavedCV`).
4. `backend/src/cv-agent/__tests__/cv-agent.integration.test.ts` — los
   evals que verificaron que las reglas 1 y 4 funcionan de verdad contra
   el modelo real, no solo en teoría.
