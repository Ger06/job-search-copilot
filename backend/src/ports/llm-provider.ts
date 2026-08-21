export type LLMMessage = {
  role: "system" | "user";
  content: string;
};

export type LLMToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type LLMToolExecutor = (toolName: string, args: Record<string, unknown>) => Promise<string>;

export type LLMJsonSchema = {
  name: string;
  schema: Record<string, unknown>;
};

export interface LLMProvider {
  generate(messages: LLMMessage[], tools: LLMToolDefinition[], executeTool: LLMToolExecutor): Promise<string>;
  generateStructuredOutput(messages: LLMMessage[], jsonSchema: LLMJsonSchema): Promise<string>;
}
