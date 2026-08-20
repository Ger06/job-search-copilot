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

export interface LLMProvider {
  generate(messages: LLMMessage[], tools: LLMToolDefinition[], executeTool: LLMToolExecutor): Promise<string>;
}
