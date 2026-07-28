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
            "O agente negociador comum tornou publicos os limites de cada participante simulado e convergiu para um piloto com criterios publicos, revisao em prazo definido e direito de contestacao.",
          tensions: [
            "Velocidade de implementacao contra necessidade de garantias.",
            "Custo operacional contra amplitude de participacao.",
            "Transparencia integral da simulacao contra cuidado com informacoes que seriam privadas em fluxos futuros."
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

    if (input.schemaName === "simulated_participant_turn") {
      const profile = parseJsonBlock(input.input, "Ficha do participante:");
      const participantName = typeof profile.displayName === "string" ? profile.displayName : "Participante";
      const constraint = typeof profile.constraint === "string" ? profile.constraint : "preciso de garantias claras";
      const concession = typeof profile.concession === "string" ? profile.concession : "aceito testar em escala limitada";

      return {
        publicMessage: [
          `${participantName}: mantenho minha posicao, mas consigo negociar se meu limite for levado a serio.`,
          `Meu limite segue sendo: ${constraint}`,
          `Minha concessao nesta rodada: ${concession}`
        ].join("\n"),
        acceptance: "conditional",
        conditions: [constraint],
        concessionsOffered: [concession],
        concerns: ["A proposta precisa deixar criterio, prazo e responsavel de revisao mais claros."]
      };
    }

    if (input.schemaName === "negotiator_round") {
      const roundMatch = input.input.match(/Rodada: (\d+)/);
      const roundNumber = Number(roundMatch?.[1] ?? 1);

      return {
        publicMessage: [
          `Agente negociador: consolidei a rodada ${roundNumber} a partir das mensagens publicas.`,
          "A proposta avanca apenas onde ha concessao explicita e preserva os limites que apareceram como inegociaveis."
        ].join("\n"),
        summary:
          "O agente negociador comum tornou publicas as condicoes dos participantes simulados e aproximou as posicoes em torno de um piloto auditavel.",
        tensions: [
          "Velocidade contra reversibilidade.",
          "Custo de medicao contra necessidade de evidencias.",
          "Participacao ampla contra simplicidade operacional."
        ],
        compromiseProposal:
          "Executar um piloto limitado com metricas publicas, prazo de revisao, assentos para afetados diretos e gatilho de pausa se houver dano mensuravel.",
        unresolvedIssues: [
          "Definir quem valida as metricas.",
          "Estabelecer como participantes tardios podem contestar a decisao."
        ],
        questionsForParticipants: [
          {
            participantName: "Ana Costa",
            question: "A revisao publica com gatilho de pausa satisfaz sua exigencia de reversibilidade?"
          }
        ],
        proposals: [
          {
            title: "Piloto auditavel com gatilho de pausa",
            description:
              "Implementar por prazo limitado, com metricas publicas, revisao obrigatoria e pausa automatica se danos mensuraveis aparecerem."
          },
          {
            title: "Aprovacao condicionada com assentos de afetados",
            description:
              "Aprovar somente se participantes diretamente afetados tiverem assento na validacao das metricas e poder de contestacao."
          },
          {
            title: "Nova coleta antes de decidir",
            description:
              "Adiar a decisao final e abrir nova coleta publica focada nas pendencias ainda nao resolvidas."
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
      values: ["reversibilidade", "protecao de afetados", "transparencia"],
      hardConstraints: ["Nao aceita implementacao irreversivel."],
      negotiablePreferences: ["Aceita piloto se houver revisao publica."],
      cooperationStyle: "principled",
      suspicionLevel: "high",
      preferredParty: "Garantias primeiro"
    },
    {
      displayName: "Bruno Lima",
      perspective: "Participante preocupado com custo e execucao.",
      stance: "Prefere uma versao pequena e mensuravel.",
      motivation: "Quer reduzir risco operacional.",
      constraint: "Nao aceita aumento de custo sem metrica.",
      concession: "Aceita ampliar se o piloto demonstrar resultado.",
      values: ["viabilidade", "metrica", "controle de custo"],
      hardConstraints: ["Nao aceita aumento de custo sem metrica."],
      negotiablePreferences: ["Aceita ampliar se o piloto demonstrar resultado."],
      cooperationStyle: "pragmatic",
      suspicionLevel: "medium",
      preferredParty: "Piloto pragmatico"
    },
    {
      displayName: "Carla Nunes",
      perspective: "Participante favoravel a beneficios rapidos.",
      stance: "Defende implementacao imediata.",
      motivation: "Ve custo alto na demora.",
      constraint: "Nao aceita adiar indefinidamente.",
      concession: "Aceita faseamento se houver data de expansao.",
      values: ["velocidade", "beneficio rapido", "execucao"],
      hardConstraints: ["Nao aceita adiar indefinidamente."],
      negotiablePreferences: ["Aceita faseamento se houver data de expansao."],
      cooperationStyle: "adversarial",
      suspicionLevel: "low",
      preferredParty: "Abertura imediata"
    },
    {
      displayName: "Diego Rocha",
      perspective: "Participante indeciso e sensivel a transparencia.",
      stance: "Pode apoiar se o processo for auditavel.",
      motivation: "Quer entender como os interesses foram ponderados.",
      constraint: "Nao aceita resumo opaco.",
      concession: "Aceita delegar avaliacao se houver registro de auditoria.",
      values: ["auditoria", "explicabilidade", "confianca"],
      hardConstraints: ["Nao aceita resumo opaco."],
      negotiablePreferences: ["Aceita delegar avaliacao se houver registro de auditoria."],
      cooperationStyle: "bridge_builder",
      suspicionLevel: "medium",
      preferredParty: "Garantias primeiro"
    },
    {
      displayName: "Elisa Martins",
      perspective: "Participante com foco em viabilidade politica.",
      stance: "Busca alternativa intermediaria.",
      motivation: "Quer uma decisao que a maioria consiga tolerar.",
      constraint: "Nao aceita proposta que ignore minorias afetadas.",
      concession: "Aceita reduzir escopo inicial.",
      values: ["coalizao", "inclusao", "estabilidade"],
      hardConstraints: ["Nao aceita proposta que ignore minorias afetadas."],
      negotiablePreferences: ["Aceita reduzir escopo inicial."],
      cooperationStyle: "bridge_builder",
      suspicionLevel: "medium",
      preferredParty: "Piloto pragmatico"
    },
    {
      displayName: "Felipe Torres",
      perspective: "Participante com preferencia forte por acao.",
      stance: "Apoia decisao ampla com monitoramento posterior.",
      motivation: "Acha que a deliberacao ja revelou convergencia suficiente.",
      constraint: "Nao aceita bloquear tudo por riscos hipoteticos.",
      concession: "Aceita gatilho de pausa se houver dano mensuravel.",
      values: ["acao", "responsabilizacao", "monitoramento"],
      hardConstraints: ["Nao aceita bloquear tudo por riscos hipoteticos."],
      negotiablePreferences: ["Aceita gatilho de pausa se houver dano mensuravel."],
      cooperationStyle: "adversarial",
      suspicionLevel: "low",
      preferredParty: "Abertura imediata"
    },
    {
      displayName: "Gabriela Alves",
      perspective: "Participante preocupada com equidade.",
      stance: "Apoia apenas se os impactos forem distribuidos.",
      motivation: "Quer evitar que beneficios e custos caiam em grupos diferentes.",
      constraint: "Nao aceita exclusao de afetados diretos.",
      concession: "Aceita piloto se houver assentos reservados para afetados.",
      values: ["equidade", "representacao", "distribuicao de impacto"],
      hardConstraints: ["Nao aceita exclusao de afetados diretos."],
      negotiablePreferences: ["Aceita piloto se houver assentos reservados para afetados."],
      cooperationStyle: "principled",
      suspicionLevel: "high",
      preferredParty: "Garantias primeiro"
    },
    {
      displayName: "Henrique Dias",
      perspective: "Participante orientado por dados.",
      stance: "Prefere testar antes de votar definitivamente.",
      motivation: "Quer evidencias comparaveis.",
      constraint: "Nao aceita decisao sem indicadores.",
      concession: "Aceita decisao rapida se houver coleta de dados em paralelo.",
      values: ["evidencia", "comparabilidade", "aprendizado"],
      hardConstraints: ["Nao aceita decisao sem indicadores."],
      negotiablePreferences: ["Aceita decisao rapida se houver coleta de dados em paralelo."],
      cooperationStyle: "pragmatic",
      suspicionLevel: "medium",
      preferredParty: "Piloto pragmatico"
    }
  ];

  return templates.slice(0, participantCount);
}

function parseJsonBlock(input: string, label: string): Record<string, unknown> {
  const start = input.indexOf(label);
  if (start === -1) {
    return {};
  }

  const afterLabel = input.slice(start + label.length);
  const jsonStart = afterLabel.indexOf("{");
  if (jsonStart === -1) {
    return {};
  }

  let depth = 0;
  let end = -1;
  const jsonCandidate = afterLabel.slice(jsonStart);
  for (let index = 0; index < jsonCandidate.length; index += 1) {
    const char = jsonCandidate[index];
    if (char === "{") {
      depth += 1;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }

  if (end === -1) {
    return {};
  }

  try {
    return JSON.parse(jsonCandidate.slice(0, end)) as Record<string, unknown>;
  } catch {
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
