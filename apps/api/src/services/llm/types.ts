export interface GenerateTextInput {
  instructions: string;
  input: string;
}

export interface GenerateJsonInput {
  instructions: string;
  input: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
}

export interface LLMProvider {
  generateText(input: GenerateTextInput): Promise<string>;
  generateJson(input: GenerateJsonInput): Promise<unknown>;
}
