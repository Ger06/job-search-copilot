import type { LLMProvider } from "../ports/llm-provider.js";
import type { CVParseResult } from "./cv-parse-result.js";
import { CV_PARSE_RESULT_JSON_SCHEMA } from "./cv-parse-result-json-schema.js";
import { CV_IMPORT_SYSTEM_PROMPT } from "./cv-import-system-prompt.js";
import { validateParsedCVStructure } from "./validate-parsed-cv-structure.js";

export async function parseCVText(rawText: string, llmProvider: LLMProvider): Promise<CVParseResult> {
  const response = await llmProvider.generateStructuredOutput(
    [
      { role: "system", content: CV_IMPORT_SYSTEM_PROMPT },
      { role: "user", content: `Extraé la experiencia laboral del siguiente currículum:\n\n${rawText}` },
    ],
    CV_PARSE_RESULT_JSON_SCHEMA,
  );

  const result = JSON.parse(response) as CVParseResult;
  validateParsedCVStructure(result);

  return result;
}
