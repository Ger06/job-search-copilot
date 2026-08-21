import { describe, expect, it } from "vitest";
import { GroqLLMProvider } from "../groq-llm-provider.js";
import type { LLMJsonSchema, LLMToolDefinition } from "../llm-provider.js";

describe("GroqLLMProvider (integración)", () => {
  it("ejecuta una tool y devuelve una respuesta final que incorpora su resultado", async () => {
    const provider = new GroqLLMProvider();

    const getCurrentYearTool: LLMToolDefinition = {
      name: "get_current_year",
      description: "Devuelve el año actual. Hay que llamar esta tool para responder la pregunta.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    };

    const result = await provider.generate(
      [
        { role: "system", content: "Respondé usando siempre la tool disponible para obtener datos que no sabés." },
        { role: "user", content: "¿Qué año es? Respondé solo con el número de año, nada más." },
      ],
      [getCurrentYearTool],
      async (toolName) => {
        if (toolName !== "get_current_year") {
          throw new Error(`Tool desconocida: ${toolName}`);
        }
        return "2026";
      },
    );

    expect(result).toContain("2026");
  });

  it("devuelve JSON que cumple el schema pedido con generateStructuredOutput", async () => {
    const provider = new GroqLLMProvider();

    const personSchema: LLMJsonSchema = {
      name: "person",
      schema: {
        type: "object",
        properties: {
          nombre: { type: "string" },
          edad: { type: "number" },
        },
        required: ["nombre", "edad"],
        additionalProperties: false,
      },
    };

    const result = await provider.generateStructuredOutput(
      [
        { role: "system", content: "Extraé los datos pedidos del texto en el formato JSON indicado." },
        { role: "user", content: "María tiene 29 años." },
      ],
      personSchema,
    );

    const parsed = JSON.parse(result) as { nombre: string; edad: number };
    expect(parsed.nombre).toBe("María");
    expect(parsed.edad).toBe(29);
  });
});
