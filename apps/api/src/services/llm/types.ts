export interface GenerateTextInput {
  instructions: string;
  input: string;
  reasoningEffort?: ReasoningEffort;
  reasoningMode?: ReasoningMode;
  verbosity?: TextVerbosity;
}

export interface GenerateJsonInput {
  instructions: string;
  input: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  reasoningEffort?: ReasoningEffort;
  reasoningMode?: ReasoningMode;
  verbosity?: TextVerbosity;
}

export type ReasoningEffort = "none" | "low" | "medium" | "high" | "xhigh" | "max";
export type ReasoningMode = "standard" | "pro";
export type TextVerbosity = "low" | "medium" | "high";

export interface LLMProvider {
  generateText(input: GenerateTextInput): Promise<string>;
  generateJson(input: GenerateJsonInput): Promise<unknown>;
}
