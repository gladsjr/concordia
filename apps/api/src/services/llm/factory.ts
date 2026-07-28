import { MockLLMProvider } from "./mockProvider.js";
import { OpenAILLMProvider } from "./openaiProvider.js";
import type { LLMProvider } from "./types.js";

export interface LLMProviders {
  general: LLMProvider;
  negotiator: LLMProvider;
  simulatedParticipant: LLMProvider;
}

export interface LLMRuntimeConfig {
  provider: string;
  generalModel?: string;
  negotiatorModel?: string;
  simulatedParticipantModel?: string;
}

export function createLLMProvider(): LLMProvider {
  return createLLMProviders().general;
}

export function getLLMRuntimeConfig(): LLMRuntimeConfig {
  const provider = process.env.LLM_PROVIDER ?? "mock";
  if (provider !== "openai") {
    return { provider };
  }

  const defaultModel = process.env.OPENAI_MODEL ?? "gpt-5.6-terra";
  return {
    provider,
    generalModel: defaultModel,
    negotiatorModel: process.env.NEGOTIATOR_MODEL ?? process.env.OPENAI_NEGOTIATOR_MODEL ?? "gpt-5.6-sol",
    simulatedParticipantModel:
      process.env.SIMULATED_AGENT_MODEL ?? process.env.OPENAI_SIMULATED_AGENT_MODEL ?? defaultModel
  };
}

export function createLLMProviders(): LLMProviders {
  const runtimeConfig = getLLMRuntimeConfig();

  if (runtimeConfig.provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY precisa estar definido quando LLM_PROVIDER=openai.");
    }

    return {
      general: new OpenAILLMProvider({
        apiKey,
        model: runtimeConfig.generalModel
      }),
      negotiator: new OpenAILLMProvider({
        apiKey,
        model: runtimeConfig.negotiatorModel
      }),
      simulatedParticipant: new OpenAILLMProvider({
        apiKey,
        model: runtimeConfig.simulatedParticipantModel
      })
    };
  }

  const mock = new MockLLMProvider();
  return {
    general: mock,
    negotiator: mock,
    simulatedParticipant: mock
  };
}
