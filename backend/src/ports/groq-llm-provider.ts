import type Groq from "groq-sdk";
import { groq } from "../groq-client.js";
import type { LLMJsonSchema, LLMMessage, LLMProvider, LLMToolDefinition, LLMToolExecutor } from "./llm-provider.js";

const MODEL_NAME = "openai/gpt-oss-120b";
const MAX_TOOL_CALL_ITERATIONS = 10;

function toGroqTools(tools: LLMToolDefinition[]): Groq.Chat.ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export class GroqLLMProvider implements LLMProvider {
  async generate(messages: LLMMessage[], tools: LLMToolDefinition[], executeTool: LLMToolExecutor): Promise<string> {
    const groqTools = toGroqTools(tools);
    const conversation: Groq.Chat.ChatCompletionMessageParam[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    for (let iteration = 0; iteration < MAX_TOOL_CALL_ITERATIONS; iteration++) {
      const response = await groq.chat.completions.create({
        model: MODEL_NAME,
        messages: conversation,
        ...(groqTools.length > 0 ? { tools: groqTools, tool_choice: "auto" } : {}),
      });

      const choice = response.choices[0];
      if (choice === undefined) {
        throw new Error("Groq no devolvió ninguna respuesta");
      }
      const message = choice.message;

      if (message.tool_calls === undefined || message.tool_calls.length === 0) {
        if (message.content === null) {
          throw new Error("Groq no devolvió contenido ni tool calls");
        }
        return message.content;
      }

      conversation.push({
        role: "assistant",
        content: message.content,
        tool_calls: message.tool_calls,
      });

      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
        const result = await executeTool(toolCall.function.name, args);
        conversation.push({ role: "tool", tool_call_id: toolCall.id, content: result });
      }
    }

    throw new Error(`Se alcanzó el máximo de ${MAX_TOOL_CALL_ITERATIONS} iteraciones de tool calling sin respuesta final`);
  }

  async generateStructuredOutput(messages: LLMMessage[], jsonSchema: LLMJsonSchema): Promise<string> {
    const response = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
      response_format: {
        type: "json_schema",
        json_schema: { name: jsonSchema.name, strict: true, schema: jsonSchema.schema },
      },
    });

    const message = response.choices[0]?.message;
    if (message?.content === null || message?.content === undefined) {
      throw new Error("Groq no devolvió contenido para el structured output");
    }

    return message.content;
  }
}
