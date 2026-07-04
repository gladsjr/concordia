import OpenAI from "openai";
import type { GenerateJsonInput, GenerateTextInput, LLMProvider } from "./types.js";

export class OpenAILLMProvider implements LLMProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(input: { apiKey: string; model?: string }) {
    this.client = new OpenAI({ apiKey: input.apiKey });
    this.model = input.model ?? "gpt-5.5";
  }

  async generateText(input: GenerateTextInput): Promise<string> {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: input.instructions,
      input: input.input
    });

    return response.output_text;
  }

  async generateJson(input: GenerateJsonInput): Promise<unknown> {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: input.instructions,
      input: input.input,
      text: {
        format: {
          type: "json_schema",
          name: input.schemaName,
          schema: input.jsonSchema,
          strict: true
        }
      }
    });

    return JSON.parse(response.output_text) as unknown;
  }
}
