import { MockLLMProvider } from "./mockProvider.js";
import { OpenAILLMProvider } from "./openaiProvider.js";
import type { LLMProvider } from "./types.js";

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? "mock";

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY precisa estar definido quando LLM_PROVIDER=openai.");
    }

    return new OpenAILLMProvider({
      apiKey,
      model: process.env.OPENAI_MODEL
    });
  }

  return new MockLLMProvider();
}
