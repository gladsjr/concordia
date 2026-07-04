import type { GenerateJsonInput, GenerateTextInput, LLMProvider } from "./types.js";

export class MockLLMProvider implements LLMProvider {
  async generateText(input: GenerateTextInput): Promise<string> {
    if (input.instructions.includes("recomendacao de voto")) {
      return "Recomendacao preliminar: revise as alternativas finais e confirme manualmente o voto antes do registro.";
    }

    return input.input;
  }

  async generateJson(input: GenerateJsonInput): Promise<unknown> {
    if (input.schemaName === "topic_summary") {
      return {
        summary: input.input,
        interviewPrompt: [
          "Qual e sua posicao inicial sobre essa pauta?",
          "O que torna essa decisao importante para voce?",
          "Que resultado voce consideraria inaceitavel?",
          "Que informacao posso compartilhar com outros participantes?"
        ].join("\n")
      };
    }

    if (input.schemaName === "information_fragments") {
      const contentMatch = input.input.match(/Mensagem do usuario:\n([\s\S]*)$/);
      const content = contentMatch?.[1] ?? input.input;
      const sentences = content
        .split(/[.!?]\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

      return {
        fragments: sentences.map((sentence) => ({
          fragmentType: classifyFragment(sentence),
          content: sentence,
          visibilityScope: sentence.toLowerCase().includes("privado") ? "private_user_agent" : "anonymous_aggregate",
          allowedUses: ["topic_mapping"]
        }))
      };
    }

    return {};
  }
}

function classifyFragment(sentence: string): string {
  const normalized = sentence.toLowerCase();

  if (normalized.includes("nao aceito") || normalized.includes("inaceitavel") || normalized.includes("limite")) {
    return "constraint";
  }

  if (normalized.includes("porque") || normalized.includes("motivo")) {
    return "motivation";
  }

  if (normalized.includes("privado") || normalized.includes("sensivel")) {
    return "sensitive";
  }

  return "preference";
}
