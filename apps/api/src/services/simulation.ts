import type { AuditLogService } from "./auditLog.js";
import type { AgentRuntime } from "./agents.js";
import type { InMemoryStore } from "../store.js";
import type { Message, Party, SimulatedParticipant, SimulationRun, Topic } from "../../../../packages/domain/src/index.js";

export class SimulationService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly agents: AgentRuntime,
    private readonly auditLog: AuditLogService
  ) {}

  async runTopicSimulation(topic: Topic, participantCount: number, roundCount = 2): Promise<SimulationRun> {
    const boundedCount = Math.max(3, Math.min(10, participantCount));
    const boundedRoundCount = Math.max(1, Math.min(4, roundCount));
    const draft = await this.agents.simulateDeliberation(topic, boundedCount);
    const partiesByName = new Map<string, Party>();
    const negotiatorAgentId = `negotiator-${topic.id}`;
    const publicNegotiationMessages: Message[] = [];
    const negotiationRounds = [];
    let currentProposal = draft.negotiation.compromiseProposal;
    let latestRoundDraft = {
      publicMessage: "Agente negociador: posicoes iniciais registradas para iniciar a negociacao publica.",
      summary: draft.negotiation.summary,
      tensions: draft.negotiation.tensions,
      compromiseProposal: draft.negotiation.compromiseProposal,
      unresolvedIssues: draft.negotiation.unresolvedIssues,
      proposals: draft.proposals
    };

    const parties = draft.parties.map((party) => {
      const createdParty = this.store.addParty({
        topicId: topic.id,
        name: party.name,
        description: party.description,
        partyAgentId: `party-agent-${slugify(party.name)}`,
        formationReason: party.formationReason,
        status: "active"
      });
      partiesByName.set(party.name, createdParty);
      return createdParty;
    });

    const fallbackParty = parties[0];
    const simulatedParticipants = draft.participants.map((participantDraft): SimulatedParticipant => {
      const user = this.store.createUser({
        displayName: participantDraft.displayName
      });
      this.store.joinTopic(topic.id, user.id);

      const party = partiesByName.get(participantDraft.preferredParty) ?? fallbackParty;
      const message = this.store.addMessage(buildPublicNegotiationMessage({
        topicId: topic.id,
        senderId: user.id,
        recipientId: negotiatorAgentId,
        roundNumber: 0,
        content: [
          `Perspectiva: ${participantDraft.perspective}`,
          `Posicao: ${participantDraft.stance}`,
          `Motivacao: ${participantDraft.motivation}`,
          `Limite: ${participantDraft.constraint}`,
          `Concessao possivel: ${participantDraft.concession}`
        ].join("\n")
      }));
      publicNegotiationMessages.push(message);

      this.store.addFragment({
        sourceMessageId: message.id,
        ownerUserId: user.id,
        fragmentType: "preference",
        content: participantDraft.stance,
        visibilityScope: "public_full",
        consentStatus: "granted",
        allowedUses: ["simulation", "topic_mapping", "party_formation"]
      });
      this.store.addFragment({
        sourceMessageId: message.id,
        ownerUserId: user.id,
        fragmentType: "motivation",
        content: participantDraft.motivation,
        visibilityScope: "public_full",
        consentStatus: "granted",
        allowedUses: ["simulation", "topic_mapping"]
      });
      this.store.addFragment({
        sourceMessageId: message.id,
        ownerUserId: user.id,
        fragmentType: "constraint",
        content: participantDraft.constraint,
        visibilityScope: "public_full",
        consentStatus: "granted",
        allowedUses: ["simulation", "negotiation"]
      });
      this.store.addFragment({
        sourceMessageId: message.id,
        ownerUserId: user.id,
        fragmentType: "argument",
        content: participantDraft.concession,
        visibilityScope: "public_full",
        consentStatus: "granted",
        allowedUses: ["simulation", "negotiation"]
      });

      return this.store.buildSimulatedParticipant({
        topicId: topic.id,
        userId: user.id,
        displayName: participantDraft.displayName,
        perspective: participantDraft.perspective,
        stance: participantDraft.stance,
        motivation: participantDraft.motivation,
        constraint: participantDraft.constraint,
        concession: participantDraft.concession,
        values: participantDraft.values,
        hardConstraints: participantDraft.hardConstraints,
        negotiablePreferences: participantDraft.negotiablePreferences,
        cooperationStyle: participantDraft.cooperationStyle,
        suspicionLevel: participantDraft.suspicionLevel,
        partyId: party.id
      });
    });

    for (let roundNumber = 1; roundNumber <= boundedRoundCount; roundNumber += 1) {
      const roundMessageIds: string[] = [];
      const participantTurns = [];

      for (const participant of simulatedParticipants) {
        const turn = await this.agents.simulateParticipantTurn({
          topic,
          participant,
          transcript: formatTranscript(publicNegotiationMessages),
          currentProposal,
          roundNumber
        });
        participantTurns.push({
          participantName: participant.displayName,
          ...turn
        });

        const message = this.store.addMessage({
          topicId: topic.id,
          senderType: "simulated_participant",
          senderId: participant.userId,
          recipientType: "negotiator_agent",
          recipientId: negotiatorAgentId,
          content: turn.publicMessage,
          visibilityScope: "public_full",
          conversationType: "public_negotiation",
          roundNumber
        });
        publicNegotiationMessages.push(message);
        roundMessageIds.push(message.id);
      }

      latestRoundDraft = await this.agents.negotiatePublicRound({
        topic,
        participantTurns,
        transcript: formatTranscript(publicNegotiationMessages),
        previousProposal: currentProposal,
        roundNumber,
        isFinalRound: roundNumber === boundedRoundCount
      });
      currentProposal = latestRoundDraft.compromiseProposal;

      const negotiatorMessage = this.store.addMessage({
        topicId: topic.id,
        senderType: "negotiator_agent",
        senderId: negotiatorAgentId,
        recipientType: "topic",
        recipientId: topic.id,
        content: [
          latestRoundDraft.publicMessage,
          "",
          "Proposta de convergencia:",
          latestRoundDraft.compromiseProposal,
          "",
          `Pendencias: ${latestRoundDraft.unresolvedIssues.join("; ")}`
        ].join("\n"),
        visibilityScope: "public_full",
        conversationType: "public_negotiation",
        roundNumber
      });
      publicNegotiationMessages.push(negotiatorMessage);
      roundMessageIds.push(negotiatorMessage.id);

      const negotiationRound = this.store.addNegotiationRound({
        topicId: topic.id,
        roundType: "simulation",
        roundNumber,
        participantsScope: parties.map((party) => party.name).join(", "),
        status: "completed",
        summary: latestRoundDraft.summary,
        tensions: latestRoundDraft.tensions,
        compromiseProposal: latestRoundDraft.compromiseProposal,
        unresolvedIssues: latestRoundDraft.unresolvedIssues,
        publicTranscriptMessageIds: publicNegotiationMessages.map((message) => message.id)
      });
      negotiationRounds.push(negotiationRound);

      for (const message of publicNegotiationMessages.filter((item) => roundMessageIds.includes(item.id))) {
        message.negotiationRoundId = negotiationRound.id;
      }
    }

    const latestNegotiationRound = negotiationRounds.at(-1);
    if (!latestNegotiationRound) {
      throw new Error("simulation_without_negotiation_round");
    }

    const proposals = latestRoundDraft.proposals.map((proposal) =>
      this.store.addProposal({
        topicId: topic.id,
        authorType: "negotiator_agent",
        authorId: negotiatorAgentId,
        title: proposal.title,
        description: proposal.description,
        status: "active",
        visibilityScope: "public_full"
      })
    );

    this.store.updateTopic(topic.id, { status: "proposal_synthesis" });

    const simulationRun = this.store.addSimulationRun({
      topicId: topic.id,
      participantCount: simulatedParticipants.length,
      roundCount: boundedRoundCount,
      participants: simulatedParticipants,
      parties,
      negotiationRound: latestNegotiationRound,
      negotiationRounds,
      publicNegotiationMessages,
      proposals
    });

    for (const message of publicNegotiationMessages) {
      this.auditLog.record({
        topicId: topic.id,
        eventType: "public_negotiation_message_created",
        actorType: message.senderType,
        actorId: message.senderId,
        payload: {
          messageId: message.id,
          recipientType: message.recipientType,
          recipientId: message.recipientId,
          negotiationRoundId: message.negotiationRoundId,
          contentHash: message.contentHash
        },
        visibilityScope: "public_full"
      });
    }

    for (const negotiationRound of negotiationRounds) {
      this.auditLog.record({
        topicId: topic.id,
        eventType: "public_negotiation_round_completed",
        actorType: "negotiator_agent",
        actorId: negotiatorAgentId,
        payload: {
          simulationRunId: simulationRun.id,
          negotiationRoundId: negotiationRound.id,
          roundNumber: negotiationRound.roundNumber,
          participantCount: simulationRun.participantCount,
          messageCount: negotiationRound.publicTranscriptMessageIds.length,
          proposalCount: simulationRun.proposals.length,
          publicTranscriptMessageIds: negotiationRound.publicTranscriptMessageIds
        },
        visibilityScope: "public_full"
      });
    }

    return simulationRun;
  }
}

function buildPublicNegotiationMessage(input: {
  topicId: string;
  senderId: string;
  recipientId: string;
  roundNumber: number;
  content: string;
}): Omit<Message, "id" | "contentHash" | "createdAt"> {
  return {
    topicId: input.topicId,
    senderType: "simulated_participant",
    senderId: input.senderId,
    recipientType: "negotiator_agent",
    recipientId: input.recipientId,
    content: input.content,
    visibilityScope: "public_full",
    conversationType: "public_negotiation",
    roundNumber: input.roundNumber
  };
}

function formatTranscript(messages: Message[]): string {
  return messages
    .map((message) => {
      const speaker = message.senderType === "negotiator_agent" ? "Agente negociador" : message.senderId;
      return `[rodada ${message.roundNumber ?? 0}] ${speaker}: ${message.content}`;
    })
    .join("\n\n");
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
