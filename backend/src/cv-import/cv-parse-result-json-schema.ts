import type { LLMJsonSchema } from "../ports/llm-provider.js";

export const CV_PARSE_RESULT_JSON_SCHEMA: LLMJsonSchema = {
  name: "cv_parse_result",
  schema: {
    type: "object",
    properties: {
      workExperiences: {
        type: "array",
        items: {
          type: "object",
          properties: {
            company: { type: "string" },
            role: { type: "string" },
            startDate: { type: "string", description: "Formato YYYY-MM-DD" },
            endDate: { type: ["string", "null"], description: "Formato YYYY-MM-DD, o null si no aplica" },
            bullets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                },
                required: ["text"],
                additionalProperties: false,
              },
            },
          },
          required: ["company", "role", "startDate", "endDate", "bullets"],
          additionalProperties: false,
        },
      },
    },
    required: ["workExperiences"],
    additionalProperties: false,
  },
};
