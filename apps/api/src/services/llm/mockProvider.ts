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

    if (input.schemaName === "deliberation_simulation") {
      const countMatch = input.input.match(/Quantidade de participantes ficticios: (\d+)/);
      const participantCount = Number(countMatch?.[1] ?? 6);
      const participants = buildMockParticipants(participantCount);

      return {
        participants,
        parties: [
          {
            name: "Garantias primeiro",
            description: "Grupo que aceita avancar se houver salvaguardas claras.",
            formationReason: "Participantes convergem em preocupacao com risco e reversibilidade.",
            memberNames: participants
              .filter((participant) => participant.preferredParty === "Garantias primeiro")
              .map((participant) => participant.displayName)
          },
          {
            name: "Piloto pragmatico",
            description: "Grupo que prefere testar uma alternativa limitada antes da decisao ampla.",
            formationReason: "Participantes convergem em experimentar com custo e prazo controlados.",
            memberNames: participants
              .filter((participant) => participant.preferredParty === "Piloto pragmatico")
              .map((participant) => participant.displayName)
          },
          {
            name: "Abertura imediata",
            description: "Grupo que valoriza velocidade e beneficios rapidos.",
            formationReason: "Participantes convergem em reduzir atraso decisorio.",
            memberNames: participants
              .filter((participant) => participant.preferredParty === "Abertura imediata")
              .map((participant) => participant.displayName)
          }
        ],
        negotiation: {
          summary:
            "Os partidos concordaram em trocar uma decisao ampla por um piloto com criterios publicos, revisao em prazo definido e direito de contestacao.",
          tensions: [
            "Velocidade de implementacao contra necessidade de garantias.",
            "Custo operacional contra amplitude de participacao.",
            "Transparencia publica contra protecao de motivacoes privadas."
          ],
          compromiseProposal:
            "Executar um piloto limitado, com metricas de sucesso, relatorio publico resumido e nova rodada de deliberacao antes de ampliar a decisao.",
          unresolvedIssues: [
            "Quem valida as metricas do piloto.",
            "Como lidar com participantes diretamente afetados que entrarem tarde."
          ]
        },
        proposals: [
          {
            title: "Piloto com salvaguardas",
            description:
              "Implementar a alternativa por prazo limitado, com criterios de avaliacao e revisao obrigatoria antes de qualquer expansao."
          },
          {
            title: "Aprovacao condicionada",
            description:
              "Aprovar a decisao apenas se as restricoes principais forem atendidas e auditadas por participantes afetados."
          },
          {
            title: "Manter status atual com nova coleta",
            description:
              "Adiar a decisao final e coletar informacoes adicionais dos grupos que indicaram maior risco."
          }
        ]
      };
    }

    return {};
  }
}

function buildMockParticipants(participantCount: number) {
  const templates = [
    {
      displayName: "Ana Costa",
      perspective: "Pessoa afetada diretamente pela decisao.",
      stance: "Aceita mudanca apenas com garantias explicitas.",
      motivation: "Quer evitar que a decisao crie perdas concentradas.",
      constraint: "Nao aceita implementacao irreversivel.",
      concession: "Aceita piloto se houver revisao publica.",
      preferredParty: "Garantias primeiro"
    },
    {
      displayName: "Bruno Lima",
      perspective: "Participante preocupado com custo e execucao.",
      stance: "Prefere uma versao pequena e mensuravel.",
      motivation: "Quer reduzir risco operacional.",
      constraint: "Nao aceita aumento de custo sem metrica.",
      concession: "Aceita ampliar se o piloto demonstrar resultado.",
      preferredParty: "Piloto pragmatico"
    },
    {
      displayName: "Carla Nunes",
      perspective: "Participante favoravel a beneficios rapidos.",
      stance: "Defende implementacao imediata.",
      motivation: "Ve custo alto na demora.",
      constraint: "Nao aceita adiar indefinidamente.",
      concession: "Aceita faseamento se houver data de expansao.",
      preferredParty: "Abertura imediata"
    },
    {
      displayName: "Diego Rocha",
      perspective: "Participante indeciso e sensivel a transparencia.",
      stance: "Pode apoiar se o processo for auditavel.",
      motivation: "Quer entender como os interesses foram ponderados.",
      constraint: "Nao aceita resumo opaco.",
      concession: "Aceita delegar avaliacao se houver registro de auditoria.",
      preferredParty: "Garantias primeiro"
    },
    {
      displayName: "Elisa Martins",
      perspective: "Participante com foco em viabilidade politica.",
      stance: "Busca alternativa intermediaria.",
      motivation: "Quer uma decisao que a maioria consiga tolerar.",
      constraint: "Nao aceita proposta que ignore minorias afetadas.",
      concession: "Aceita reduzir escopo inicial.",
      preferredParty: "Piloto pragmatico"
    },
    {
      displayName: "Felipe Torres",
      perspective: "Participante com preferencia forte por acao.",
      stance: "Apoia decisao ampla com monitoramento posterior.",
      motivation: "Acha que a deliberacao ja revelou convergencia suficiente.",
      constraint: "Nao aceita bloquear tudo por riscos hipoteticos.",
      concession: "Aceita gatilho de pausa se houver dano mensuravel.",
      preferredParty: "Abertura imediata"
    },
    {
      displayName: "Gabriela Alves",
      perspective: "Participante preocupada com equidade.",
      stance: "Apoia apenas se os impactos forem distribuidos.",
      motivation: "Quer evitar que beneficios e custos caiam em grupos diferentes.",
      constraint: "Nao aceita exclusao de afetados diretos.",
      concession: "Aceita piloto se houver assentos reservados para afetados.",
      preferredParty: "Garantias primeiro"
    },
    {
      displayName: "Henrique Dias",
      perspective: "Participante orientado por dados.",
      stance: "Prefere testar antes de votar definitivamente.",
      motivation: "Quer evidencias comparaveis.",
      constraint: "Nao aceita decisao sem indicadores.",
      concession: "Aceita decisao rapida se houver coleta de dados em paralelo.",
      preferredParty: "Piloto pragmatico"
    }
  ];

  return templates.slice(0, participantCount);
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
