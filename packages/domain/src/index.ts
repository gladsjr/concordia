export const topicStatuses = [
  "draft",
  "published",
  "intake",
  "mapping",
  "party_formation",
  "intra_party_deliberation",
  "inter_party_negotiation",
  "proposal_synthesis",
  "voting_preparation",
  "voting",
  "result_published",
  "appeal_or_review",
  "closed"
] as const;

export type TopicStatus = (typeof topicStatuses)[number];

export const visibilityScopes = [
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
] as const;

export type VisibilityScope = (typeof visibilityScopes)[number];

export const decisionMechanisms = [
  "simple_majority",
  "approval",
  "quadratic"
] as const;

export type DecisionMechanism = (typeof decisionMechanisms)[number];

export type ActorType = "user" | "user_agent" | "coordinator_agent" | "party_agent" | "system";

export interface User {
  id: string;
  displayName: string;
  identityProvider: "local" | "external";
  createdAt: string;
  status: "active" | "inactive";
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  deliberativeQuestion: string;
  creatorUserId: string;
  coordinatorAgentId: string;
  status: TopicStatus;
  visibility: VisibilityScope;
  participationPolicy: string;
  decisionPolicy: DecisionMechanism;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  topicId: string;
  userId: string;
  userAgentId: string;
  role: "creator" | "participant" | "observer";
  eligibilityStatus: "eligible" | "pending" | "rejected";
  joinedAt: string;
}

export interface Message {
  id: string;
  topicId: string;
  senderType: ActorType;
  senderId: string;
  recipientType: ActorType | "topic";
  recipientId: string;
  content: string;
  contentHash: string;
  visibilityScope: VisibilityScope;
  createdAt: string;
}

export interface InformationFragment {
  id: string;
  sourceMessageId: string;
  ownerUserId: string;
  fragmentType: "preference" | "motivation" | "constraint" | "sensitive" | "argument";
  content: string;
  contentHash: string;
  visibilityScope: VisibilityScope;
  consentStatus: "pending" | "granted" | "denied";
  allowedUses: string[];
  createdAt: string;
}

export interface Consent {
  id: string;
  userId: string;
  fragmentId: string;
  fromScope: VisibilityScope;
  toScope: VisibilityScope;
  purpose: string;
  granted: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Party {
  id: string;
  topicId: string;
  parentPartyId?: string;
  name: string;
  description: string;
  partyAgentId: string;
  formationReason: string;
  status: "active" | "merged" | "closed";
  createdAt: string;
}

export interface SimulatedParticipant {
  id: string;
  topicId: string;
  userId: string;
  displayName: string;
  perspective: string;
  stance: string;
  motivation: string;
  constraint: string;
  concession: string;
  partyId: string;
  createdAt: string;
}

export interface NegotiationRound {
  id: string;
  topicId: string;
  roundType: "simulation";
  participantsScope: string;
  status: "completed";
  summary: string;
  tensions: string[];
  compromiseProposal: string;
  unresolvedIssues: string[];
  startedAt: string;
  endedAt: string;
}

export interface Proposal {
  id: string;
  topicId: string;
  authorType: ActorType;
  authorId: string;
  title: string;
  description: string;
  status: "draft" | "active" | "accepted" | "rejected" | "archived";
  visibilityScope: VisibilityScope;
  createdAt: string;
}

export interface Vote {
  id: string;
  topicId: string;
  proposalId: string;
  userId: string;
  voteType: DecisionMechanism;
  votePayload: Record<string, unknown>;
  voteHash: string;
  createdAt: string;
}

export interface SimulationRun {
  id: string;
  topicId: string;
  participantCount: number;
  participants: SimulatedParticipant[];
  parties: Party[];
  negotiationRound: NegotiationRound;
  proposals: Proposal[];
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  topicId?: string;
  eventType: string;
  actorType: ActorType;
  actorId: string;
  payloadHash: string;
  payloadRedacted: Record<string, unknown>;
  visibilityScope: VisibilityScope;
  previousEventHash?: string;
  eventHash: string;
  anchorId?: string;
  createdAt: string;
}
