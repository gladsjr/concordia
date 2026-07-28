import type { InformationFragment, Message, Topic } from "../../../../packages/domain/src/index.js";
import { z } from "zod";
import type { LLMProviders } from "./llm/factory.js";
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

const simulatedDeliberationSchema = z.object({
  participants: z.array(
    z.object({
      displayName: z.string(),
      perspective: z.string(),
      stance: z.string(),
      motivation: z.string(),
      constraint: z.string(),
      concession: z.string(),
      values: z.array(z.string()),
      hardConstraints: z.array(z.string()),
      negotiablePreferences: z.array(z.string()),
      cooperationStyle: z.enum(["pragmatic", "principled", "adversarial", "bridge_builder"]),
      suspicionLevel: z.enum(["low", "medium", "high"]),
      preferredParty: z.string()
    })
  ),
  parties: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      formationReason: z.string(),
      memberNames: z.array(z.string())
    })
  ),
  negotiation: z.object({
    summary: z.string(),
    tensions: z.array(z.string()),
    compromiseProposal: z.string(),
    unresolvedIssues: z.array(z.string())
  }),
  proposals: z.array(
    z.object({
      title: z.string(),
      description: z.string()
    })
  )
});

export type SimulatedDeliberationDraft = z.infer<typeof simulatedDeliberationSchema>;

const participantTurnSchema = z.object({
  publicMessage: z.string(),
  acceptance: z.enum(["accept", "reject", "conditional"]),
  conditions: z.array(z.string()),
  concessionsOffered: z.array(z.string()),
  concerns: z.array(z.string())
});

export type ParticipantTurnDraft = z.infer<typeof participantTurnSchema>;

const negotiatorRoundSchema = z.object({
  publicMessage: z.string(),
  summary: z.string(),
  tensions: z.array(z.string()),
  compromiseProposal: z.string(),
  unresolvedIssues: z.array(z.string()),
  questionsForParticipants: z.array(
    z.object({
      participantName: z.string(),
      question: z.string()
    })
  ),
  proposals: z.array(
    z.object({
      title: z.string(),
      description: z.string()
    })
  )
});

export type NegotiatorRoundDraft = z.infer<typeof negotiatorRoundSchema>;

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

const simulatedDeliberationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    participants: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          displayName: { type: "string" },
          perspective: { type: "string" },
          stance: { type: "string" },
          motivation: { type: "string" },
          constraint: { type: "string" },
          concession: { type: "string" },
          values: {
            type: "array",
            items: { type: "string" }
          },
          hardConstraints: {
            type: "array",
            items: { type: "string" }
          },
          negotiablePreferences: {
            type: "array",
            items: { type: "string" }
          },
          cooperationStyle: {
            type: "string",
            enum: ["pragmatic", "principled", "adversarial", "bridge_builder"]
          },
          suspicionLevel: {
            type: "string",
            enum: ["low", "medium", "high"]
          },
          preferredParty: { type: "string" }
        },
        required: [
          "displayName",
          "perspective",
          "stance",
          "motivation",
          "constraint",
          "concession",
          "values",
          "hardConstraints",
          "negotiablePreferences",
          "cooperationStyle",
          "suspicionLevel",
          "preferredParty"
        ]
      }
    },
    parties: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          formationReason: { type: "string" },
          memberNames: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["name", "description", "formationReason", "memberNames"]
      }
    },
    negotiation: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        tensions: {
          type: "array",
          items: { type: "string" }
        },
        compromiseProposal: { type: "string" },
        unresolvedIssues: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["summary", "tensions", "compromiseProposal", "unresolvedIssues"]
    },
    proposals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["title", "description"]
      }
    }
  },
  required: ["participants", "parties", "negotiation", "proposals"]
};

const participantTurnJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    publicMessage: { type: "string" },
    acceptance: {
      type: "string",
      enum: ["accept", "reject", "conditional"]
    },
    conditions: {
      type: "array",
      items: { type: "string" }
    },
    concessionsOffered: {
      type: "array",
      items: { type: "string" }
    },
    concerns: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["publicMessage", "acceptance", "conditions", "concessionsOffered", "concerns"]
};

const negotiatorRoundJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    publicMessage: { type: "string" },
    summary: { type: "string" },
    tensions: {
      type: "array",
      items: { type: "string" }
    },
    compromiseProposal: { type: "string" },
    unresolvedIssues: {
      type: "array",
      items: { type: "string" }
    },
    questionsForParticipants: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          participantName: { type: "string" },
          question: { type: "string" }
        },
        required: ["participantName", "question"]
      }
    },
    proposals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["title", "description"]
      }
    }
  },
  required: [
    "publicMessage",
    "summary",
    "tensions",
    "compromiseProposal",
    "unresolvedIssues",
    "questionsForParticipants",
    "proposals"
  ]
};

export class AgentRuntime {
  private readonly generalProvider: LLMProvider;
  private readonly negotiatorProvider: LLMProvider;
  private readonly simulatedParticipantProvider: LLMProvider;

  constructor(providers: LLMProvider | LLMProviders) {
    if ("generateJson" in providers) {
      this.generalProvider = providers;
      this.negotiatorProvider = providers;
      this.simulatedParticipantProvider = providers;
      return;
    }

    this.generalProvider = providers.general;
    this.negotiatorProvider = providers.negotiator;
    this.simulatedParticipantProvider = providers.simulatedParticipant;
  }

  async summarizeTopicForUser(topic: Topic): Promise<{ summary: string; interviewPrompt: string }> {
    const result = await this.generalProvider.generateJson({
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
    const result = await this.generalProvider.generateJson({
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
    return this.generalProvider.generateText({
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

  async simulateDeliberation(topic: Topic, participantCount: number): Promise<SimulatedDeliberationDraft> {
    const result = await this.negotiatorProvider.generateJson({
      schemaName: "deliberation_simulation",
      jsonSchema: simulatedDeliberationJsonSchema,
      instructions: [
        "Voce e o agente negociador comum de uma pauta no Concordia.",
        "Crie uma simulacao realista de negociacao publica com participantes ficticios.",
        "Cada participante deve ter uma perspectiva distinta, uma posicao clara, uma motivacao, uma restricao e uma concessao possivel.",
        "Agrupe participantes em blocos dinamicos apenas como leitura auxiliar, mas a negociacao principal acontece diretamente entre cada participante e o agente negociador comum.",
        "Produza uma rodada de negociacao publica, com proposta de compromisso e alternativas finais concretas.",
        "Nao crie conversas bilaterais ocultas entre participante e agente negociador.",
        "Nao use nomes de pessoas reais. Nao invente fatos externos. Mantenha tudo compativel com a pauta recebida."
      ].join(" "),
      reasoningEffort: "medium",
      verbosity: "medium",
      input: [
        `Quantidade de participantes ficticios: ${participantCount}`,
        `Titulo: ${topic.title}`,
        `Descricao: ${topic.description}`,
        `Pergunta deliberativa: ${topic.deliberativeQuestion}`,
        `Mecanismo de decisao: ${topic.decisionPolicy}`
      ].join("\n")
    });

    const parsed = simulatedDeliberationSchema.parse(result);
    return {
      ...parsed,
      participants: parsed.participants.slice(0, participantCount),
      parties: parsed.parties.slice(0, Math.max(2, Math.min(4, participantCount))),
      proposals: parsed.proposals.slice(0, 4)
    };
  }

  async simulateParticipantTurn(input: {
    topic: Topic;
    participant: {
      displayName: string;
      perspective: string;
      stance: string;
      motivation: string;
      constraint: string;
      concession: string;
      values: string[];
      hardConstraints: string[];
      negotiablePreferences: string[];
      cooperationStyle: string;
      suspicionLevel: string;
    };
    transcript: string;
    currentProposal: string;
    roundNumber: number;
  }): Promise<ParticipantTurnDraft> {
    const result = await this.simulatedParticipantProvider.generateJson({
      schemaName: "simulated_participant_turn",
      jsonSchema: participantTurnJsonSchema,
      reasoningEffort: "medium",
      verbosity: "medium",
      instructions: [
        "Voce e um participante simulado cognitivamente consistente em uma negociacao publica do Concordia.",
        "Responda como uma pessoa com valores, limites e estilo de cooperacao estaveis, nao como caricatura.",
        "Considere o transcript publico e a proposta atual.",
        "Nao revele raciocinio privado. Produza apenas a mensagem publica e campos estruturados.",
        "Se aceitar condicionalmente, explicite condicoes concretas e concessoes reais.",
        "Nao invente fatos externos; trabalhe apenas com a pauta e o estado da negociacao."
      ].join(" "),
      input: [
        `Rodada: ${input.roundNumber}`,
        `Titulo: ${input.topic.title}`,
        `Descricao: ${input.topic.description}`,
        `Pergunta deliberativa: ${input.topic.deliberativeQuestion}`,
        "",
        "Ficha do participante:",
        JSON.stringify(input.participant, null, 2),
        "",
        "Proposta atual:",
        input.currentProposal || "Ainda nao ha proposta consolidada.",
        "",
        "Transcript publico ate agora:",
        input.transcript || "Sem mensagens anteriores."
      ].join("\n")
    });

    return participantTurnSchema.parse(result);
  }

  async negotiatePublicRound(input: {
    topic: Topic;
    participantTurns: Array<{
      participantName: string;
      publicMessage: string;
      acceptance: string;
      conditions: string[];
      concessionsOffered: string[];
      concerns: string[];
    }>;
    transcript: string;
    previousProposal: string;
    roundNumber: number;
    isFinalRound: boolean;
  }): Promise<NegotiatorRoundDraft> {
    const result = await this.negotiatorProvider.generateJson({
      schemaName: "negotiator_round",
      jsonSchema: negotiatorRoundJsonSchema,
      reasoningEffort: input.isFinalRound ? "high" : "medium",
      verbosity: "medium",
      instructions: [
        "Voce e o agente negociador comum do Concordia.",
        "Voce nao representa nenhum participante; sua funcao e mediar uma negociacao publica auditavel.",
        "Nao pode existir conversa bilateral oculta entre voce e um participante.",
        "Leia as mensagens publicas, identifique limites reais, concessoes possiveis e pontos de convergencia.",
        "Produza uma mensagem publica de rodada, uma proposta de compromisso concreta e perguntas publicas quando ainda houver lacunas.",
        "As alternativas finais devem ser diferentes entre si, votaveis e compativeis com os limites revelados.",
        "Nao invente fatos externos; use apenas a pauta e o transcript."
      ].join(" "),
      input: [
        `Rodada: ${input.roundNumber}`,
        `Rodada final: ${input.isFinalRound ? "sim" : "nao"}`,
        `Titulo: ${input.topic.title}`,
        `Descricao: ${input.topic.description}`,
        `Pergunta deliberativa: ${input.topic.deliberativeQuestion}`,
        `Mecanismo de decisao: ${input.topic.decisionPolicy}`,
        "",
        "Proposta anterior:",
        input.previousProposal || "Ainda nao ha proposta consolidada.",
        "",
        "Turnos dos participantes nesta rodada:",
        JSON.stringify(input.participantTurns, null, 2),
        "",
        "Transcript publico acumulado:",
        input.transcript || "Sem mensagens anteriores."
      ].join("\n")
    });

    const parsed = negotiatorRoundSchema.parse(result);
    return {
      ...parsed,
      proposals: parsed.proposals.slice(0, 4)
    };
  }
}
