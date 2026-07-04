import type { InformationFragment, Message, Topic } from "../../../../packages/domain/src/index.js";

export class AgentRuntime {
  summarizeTopicForUser(topic: Topic): string {
    return `A pauta "${topic.title}" pergunta: ${topic.deliberativeQuestion}. Status atual: ${topic.status}.`;
  }

  draftInterviewPrompt(topic: Topic): string {
    return [
      `Qual e sua posicao inicial sobre "${topic.title}"?`,
      "O que torna essa decisao importante para voce?",
      "Que resultado voce consideraria inaceitavel?",
      "Que informacao posso compartilhar com outros participantes?"
    ].join("\n");
  }

  extractInformationFragments(message: Message, ownerUserId: string): Omit<InformationFragment, "id" | "contentHash" | "createdAt">[] {
    const sentences = message.content
      .split(/[.!?]\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    return sentences.map((sentence) => ({
      sourceMessageId: message.id,
      ownerUserId,
      fragmentType: classifyFragment(sentence),
      content: sentence,
      visibilityScope: sentence.toLowerCase().includes("privado") ? "private_user_agent" : "anonymous_aggregate",
      consentStatus: "pending",
      allowedUses: ["topic_mapping"]
    }));
  }

  prepareVoteRecommendation(topic: Topic): string {
    return `Recomendacao preliminar: revise as alternativas finais da pauta "${topic.title}" e confirme manualmente o voto antes do registro.`;
  }
}

function classifyFragment(sentence: string): InformationFragment["fragmentType"] {
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
