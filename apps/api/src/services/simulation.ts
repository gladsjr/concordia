import type { AuditLogService } from "./auditLog.js";
import type { AgentRuntime } from "./agents.js";
import type { InMemoryStore } from "../store.js";
import type { Party, SimulatedParticipant, SimulationRun, Topic } from "../../../../packages/domain/src/index.js";

export class SimulationService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly agents: AgentRuntime,
    private readonly auditLog: AuditLogService
  ) {}

  async runTopicSimulation(topic: Topic, participantCount: number): Promise<SimulationRun> {
    const boundedCount = Math.max(3, Math.min(10, participantCount));
    const draft = await this.agents.simulateDeliberation(topic, boundedCount);
    const partiesByName = new Map<string, Party>();

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
      const message = this.store.addMessage({
        topicId: topic.id,
        senderType: "user",
        senderId: user.id,
        recipientType: "user_agent",
        recipientId: `agent-${user.id}`,
        content: [
          `Perspectiva: ${participantDraft.perspective}`,
          `Posicao: ${participantDraft.stance}`,
          `Motivacao: ${participantDraft.motivation}`,
          `Restricao: ${participantDraft.constraint}`,
          `Concessao possivel: ${participantDraft.concession}`
        ].join("\n"),
        visibilityScope: "anonymous_aggregate"
      });

      this.store.addFragment({
        sourceMessageId: message.id,
        ownerUserId: user.id,
        fragmentType: "preference",
        content: participantDraft.stance,
        visibilityScope: "anonymous_aggregate",
        consentStatus: "granted",
        allowedUses: ["simulation", "topic_mapping", "party_formation"]
      });
      this.store.addFragment({
        sourceMessageId: message.id,
        ownerUserId: user.id,
        fragmentType: "motivation",
        content: participantDraft.motivation,
        visibilityScope: "anonymous_aggregate",
        consentStatus: "granted",
        allowedUses: ["simulation", "topic_mapping"]
      });
      this.store.addFragment({
        sourceMessageId: message.id,
        ownerUserId: user.id,
        fragmentType: "constraint",
        content: participantDraft.constraint,
        visibilityScope: "anonymous_aggregate",
        consentStatus: "granted",
        allowedUses: ["simulation", "negotiation"]
      });
      this.store.addFragment({
        sourceMessageId: message.id,
        ownerUserId: user.id,
        fragmentType: "argument",
        content: participantDraft.concession,
        visibilityScope: "anonymous_aggregate",
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
        partyId: party.id
      });
    });

    const negotiationRound = this.store.addNegotiationRound({
      topicId: topic.id,
      roundType: "simulation",
      participantsScope: parties.map((party) => party.name).join(", "),
      status: "completed",
      summary: draft.negotiation.summary,
      tensions: draft.negotiation.tensions,
      compromiseProposal: draft.negotiation.compromiseProposal,
      unresolvedIssues: draft.negotiation.unresolvedIssues
    });

    const proposals = draft.proposals.map((proposal) =>
      this.store.addProposal({
        topicId: topic.id,
        authorType: "coordinator_agent",
        authorId: topic.coordinatorAgentId,
        title: proposal.title,
        description: proposal.description,
        status: "active",
        visibilityScope: "public_summary"
      })
    );

    this.store.updateTopic(topic.id, { status: "proposal_synthesis" });

    const simulationRun = this.store.addSimulationRun({
      topicId: topic.id,
      participantCount: simulatedParticipants.length,
      participants: simulatedParticipants,
      parties,
      negotiationRound,
      proposals
    });

    this.auditLog.record({
      topicId: topic.id,
      eventType: "simulation_run_created",
      actorType: "coordinator_agent",
      actorId: topic.coordinatorAgentId,
      payload: {
        simulationRunId: simulationRun.id,
        participantCount: simulationRun.participantCount,
        partyCount: simulationRun.parties.length,
        proposalCount: simulationRun.proposals.length
      },
      visibilityScope: "public_summary"
    });

    return simulationRun;
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
