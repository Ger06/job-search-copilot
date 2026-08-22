import { findRelevantBullets } from "../bullets/bullet-service.js";
import type { BulletRepository } from "../bullets/bullet-repository.js";
import type { EmbeddingProvider } from "../ports/embedding-provider.js";
import type { LLMToolDefinition, LLMToolExecutor } from "../ports/llm-provider.js";

export const GET_RELEVANT_BULLETS_TOOL: LLMToolDefinition = {
  name: "get_relevant_bullets_for_experience",
  description:
    "Devuelve los bullets más relevantes para el texto de la vacante, para una work experience puntual del historial, ordenados por relevancia descendente. Hay que llamar esta tool una vez por cada work_experience_id dado en el prompt, antes de escribir el contenido correspondiente a esa experiencia.",
  parameters: {
    type: "object",
    properties: {
      work_experience_id: {
        type: "string",
        description: "El id de la work experience para la que se quieren los bullets relevantes.",
      },
    },
    required: ["work_experience_id"],
    additionalProperties: false,
  },
};

export function createGetRelevantBulletsExecutor(
  jobDescriptionText: string,
  sessionId: string,
  bulletRepository: BulletRepository,
  embeddingProvider: EmbeddingProvider,
): LLMToolExecutor {
  return async (toolName, args) => {
    if (toolName !== GET_RELEVANT_BULLETS_TOOL.name) {
      throw new Error(`Tool desconocida: ${toolName}`);
    }

    const workExperienceId = args["work_experience_id"];
    if (typeof workExperienceId !== "string") {
      throw new Error("work_experience_id inválido: se esperaba un string");
    }

    const bullets = await findRelevantBullets(jobDescriptionText, workExperienceId, sessionId, bulletRepository, embeddingProvider);
    return JSON.stringify(bullets.map((bullet) => bullet.text));
  };
}
