import type { InformationFragment, Message, Topic } from "../../../../packages/domain/src/index.js";
import { z } from "zod";
import type { LLMProvider } from "./llm/types.js";

const topicSummarySchema = z.object({
  summary: z.string(),
  interviewPrompt: z.string()
});

const visibilityScopeSchema = z.enum([
  "private_user_agent",
  "private_delegate_memory",
  "anonymous_aggregate",
  "party_internal",
  "party_agent_only",
  "inter_party_restricted",
  "affected_participants",
  "public_summary",
  "public_full",
  "cryptographic_commitment_only"
]);

const fragmentSchema = z.object({
  fragmentType: z.enum(["preference", "motivation", "constraint", "sensitive", "argument"]),
  content: z.string(),
  visibilityScope: visibilityScopeSchema,
  allowedUses: z.array(z.string())
});

const fragmentsSchema = z.object({
  fragments: z.array(fragmentSchema)
});

const topicSummaryJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    interviewPrompt: { type: "string" }
  },
  required: ["summary", "interviewPrompt"]
};

const informationFragmentsJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    fragments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          fragmentType: {
            type: "string",
            enum: ["preference", "motivation", "constraint", "sensitive", "argument"]
          },
          content: { type: "string" },
          visibilityScope: {
            type: "string",
            enum: [
              "private_user_agent",
              "private_delegate_memory",
              "anonymous_aggregate",
              "party_internal",
              "party_agent_only",
              "inter_party_restricted",
              "affected_participants",
              "public_summary",
              "public_full",
              "cryptographic_commitment_only"
            ]
          },
          allowedUses: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["fragmentType", "content", "visibilityScope", "allowedUses"]
      }
    }
  },
  required: ["fragments"]
};

export class AgentRuntime {
  constructor(private readonly llmProvider: LLMProvider) {}

  async summarizeTopicForUser(topic: Topic): Promise<{ summary: string; interviewPrompt: string }> {
    const result = await this.llmProvider.generateJson({
      schemaName: "topic_summary",
      jsonSchema: topicSummaryJsonSchema,
      instructions: [
        "Voce e um agente representante de usuario no protocolo Concordia.",
        "Resuma a pauta de forma objetiva e gere perguntas iniciais de entrevista.",
        "Nao tome decisoes pelo usuario. Destaque privacidade, prazo e pergunta deliberativa quando possivel."
      ].join(" "),
      input: [
        `Titulo: ${topic.title}`,
        `Descricao: ${topic.description}`,
        `Pergunta deliberativa: ${topic.deliberativeQuestion}`,
        `Status: ${topic.status}`,
        `Mecanismo de decisao: ${topic.decisionPolicy}`
      ].join("\n")
    });

    return topicSummarySchema.parse(result);
  }

  async extractInformationFragments(
    message: Message,
    ownerUserId: string
  ): Promise<Omit<InformationFragment, "id" | "contentHash" | "createdAt">[]> {
    const result = await this.llmProvider.generateJson({
      schemaName: "information_fragments",
      jsonSchema: informationFragmentsJsonSchema,
      instructions: [
        "Voce extrai fragmentos informacionais de mensagens de usuarios em uma deliberacao.",
        "Separe preferencias, motivacoes, restricoes, informacoes sensiveis e argumentos.",
        "Escolha o menor escopo de visibilidade adequado.",
        "Na duvida, use private_user_agent ou private_delegate_memory.",
        "Nunca amplie escopo por conveniencia."
      ].join(" "),
      input: [
        `Escopo original da mensagem: ${message.visibilityScope}`,
        "Mensagem do usuario:",
        message.content
      ].join("\n")
    });

    const parsed = fragmentsSchema.parse(result);
    return parsed.fragments.map((fragment) => ({
      sourceMessageId: message.id,
      ownerUserId,
      fragmentType: fragment.fragmentType,
      content: fragment.content,
      visibilityScope: fragment.visibilityScope,
      consentStatus: "pending",
      allowedUses: fragment.allowedUses
    }));
  }

  async prepareVoteRecommendation(topic: Topic): Promise<string> {
    return this.llmProvider.generateText({
      instructions: [
        "Voce prepara recomendacao de voto para um usuario no Concordia.",
        "Esta e uma recomendacao de voto preliminar, sem substituir confirmacao humana.",
        "Se faltarem alternativas finais, diga que o usuario deve aguardar ou revisar as alternativas antes de votar."
      ].join(" "),
      input: [
        `Titulo: ${topic.title}`,
        `Descricao: ${topic.description}`,
        `Pergunta deliberativa: ${topic.deliberativeQuestion}`,
        `Status: ${topic.status}`,
        `Mecanismo de decisao: ${topic.decisionPolicy}`
      ].join("\n")
    });
  }
}
