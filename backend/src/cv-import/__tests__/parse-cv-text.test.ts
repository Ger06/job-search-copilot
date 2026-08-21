import { describe, expect, it } from "vitest";
import { parseCVText } from "../parse-cv-text.js";
import { CV_PARSE_RESULT_JSON_SCHEMA } from "../cv-parse-result-json-schema.js";
import type { CVParseResult } from "../cv-parse-result.js";
import type { LLMJsonSchema, LLMMessage, LLMProvider, LLMToolDefinition, LLMToolExecutor } from "../../ports/llm-provider.js";

function createFakeLLMProvider(
  behavior: (messages: LLMMessage[], jsonSchema: LLMJsonSchema) => string,
): LLMProvider & { structuredCalls: { messages: LLMMessage[]; jsonSchema: LLMJsonSchema }[] } {
  const structuredCalls: { messages: LLMMessage[]; jsonSchema: LLMJsonSchema }[] = [];
  return {
    structuredCalls,
    async generate(_messages: LLMMessage[], _tools: LLMToolDefinition[], _executeTool: LLMToolExecutor) {
      throw new Error("no debería llamarse a generate en este test");
    },
    async generateStructuredOutput(messages, jsonSchema) {
      structuredCalls.push({ messages, jsonSchema });
      return behavior(messages, jsonSchema);
    },
  };
}

const VALID_RESULT: CVParseResult = {
  workExperiences: [
    {
      company: "Acme Corp",
      role: "Backend Engineer",
      startDate: "2020-01-01",
      endDate: null,
      bullets: [{ text: "Reduje el tiempo de build en 40%" }],
    },
  ],
};

describe("parseCVText", () => {
  it("llama a generateStructuredOutput con el schema del CV y un mensaje que incluye el rawText", async () => {
    const rawText = "Juan Pérez\nBackend Engineer en Acme Corp (2020 - presente)\n- Reduje el build en 40%";
    const llmProvider = createFakeLLMProvider(() => JSON.stringify(VALID_RESULT));

    await parseCVText(rawText, llmProvider);

    expect(llmProvider.structuredCalls).toHaveLength(1);
    expect(llmProvider.structuredCalls[0]?.jsonSchema).toBe(CV_PARSE_RESULT_JSON_SCHEMA);
    const userMessage = llmProvider.structuredCalls[0]?.messages.find((message) => message.role === "user");
    expect(userMessage?.content).toContain(rawText);
  });

  it("parsea el JSON devuelto y lo devuelve tal cual si es válido", async () => {
    const llmProvider = createFakeLLMProvider(() => JSON.stringify(VALID_RESULT));

    const result = await parseCVText("cualquier texto", llmProvider);

    expect(result).toEqual(VALID_RESULT);
  });

  it("propaga el error si el resultado no pasa validateParsedCVStructure", async () => {
    const invalidResult: CVParseResult = {
      workExperiences: [
        {
          company: "Acme Corp",
          role: "Backend Engineer",
          startDate: "2020-01-01",
          endDate: null,
          bullets: [{ text: "   " }],
        },
      ],
    };
    const llmProvider = createFakeLLMProvider(() => JSON.stringify(invalidResult));

    await expect(parseCVText("cualquier texto", llmProvider)).rejects.toThrow();
  });
});
