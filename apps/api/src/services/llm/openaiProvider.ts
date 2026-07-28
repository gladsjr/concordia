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
    const request = {
      model: this.model,
      instructions: input.instructions,
      input: input.input,
      ...buildReasoningOptions(input),
      ...buildTextOptions(input)
    };
    const response = await this.client.responses.create(request as OpenAI.Responses.ResponseCreateParamsNonStreaming);

    return response.output_text;
  }

  async generateJson(input: GenerateJsonInput): Promise<unknown> {
    const request = {
      model: this.model,
      instructions: input.instructions,
      input: input.input,
      ...buildReasoningOptions(input),
      text: {
        ...buildTextOptions(input).text,
        format: {
          type: "json_schema",
          name: input.schemaName,
          schema: input.jsonSchema,
          strict: true
        }
      }
    };
    const response = await this.client.responses.create(request as OpenAI.Responses.ResponseCreateParamsNonStreaming);

    return JSON.parse(response.output_text) as unknown;
  }
}

function buildReasoningOptions(input: GenerateJsonInput | GenerateTextInput) {
  if (!input.reasoningEffort && !input.reasoningMode) {
    return {};
  }

  return {
    reasoning: {
      ...(input.reasoningEffort ? { effort: input.reasoningEffort } : {}),
      ...(input.reasoningMode ? { mode: input.reasoningMode } : {})
    }
  };
}

function buildTextOptions(input: GenerateJsonInput | GenerateTextInput) {
  if (!input.verbosity) {
    return {};
  }

  return {
    text: {
      verbosity: input.verbosity
    }
  };
}
