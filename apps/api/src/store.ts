import { randomUUID } from "node:crypto";
import type {
  Consent,
  InformationFragment,
  Message,
  Participant,
  Proposal,
  Topic,
  User,
  Vote
} from "../../../packages/domain/src/index.js";
import { hashPayload } from "./services/hash.js";

const now = () => new Date().toISOString();

export class InMemoryStore {
  readonly users: User[] = [
    {
      id: "user-demo",
      displayName: "Usuario demo",
      identityProvider: "local",
      createdAt: now(),
      status: "active"
    }
  ];

  readonly topics: Topic[] = [];
  readonly participants: Participant[] = [];
  readonly messages: Message[] = [];
  readonly fragments: InformationFragment[] = [];
  readonly consents: Consent[] = [];
  readonly proposals: Proposal[] = [];
  readonly votes: Vote[] = [];

  createTopic(input: {
    title: string;
    description: string;
    deliberativeQuestion: string;
    creatorUserId?: string;
    visibility?: Topic["visibility"];
    decisionPolicy?: Topic["decisionPolicy"];
  }): Topic {
    const timestamp = now();
    const topic: Topic = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      deliberativeQuestion: input.deliberativeQuestion,
      creatorUserId: input.creatorUserId ?? "user-demo",
      coordinatorAgentId: `coordinator-${randomUUID()}`,
      status: "draft",
      visibility: input.visibility ?? "public_summary",
      participationPolicy: "open",
      decisionPolicy: input.decisionPolicy ?? "approval",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.topics.push(topic);
    this.joinTopic(topic.id, topic.creatorUserId, "creator");
    return topic;
  }

  updateTopic(topicId: string, patch: Partial<Topic>): Topic | undefined {
    const topic = this.topics.find((item) => item.id === topicId);
    if (!topic) {
      return undefined;
    }

    Object.assign(topic, patch, { updatedAt: now() });
    return topic;
  }

  joinTopic(topicId: string, userId = "user-demo", role: Participant["role"] = "participant"): Participant {
    const existing = this.participants.find((participant) => participant.topicId === topicId && participant.userId === userId);
    if (existing) {
      return existing;
    }

    const participant: Participant = {
      id: randomUUID(),
      topicId,
      userId,
      userAgentId: `agent-${userId}`,
      role,
      eligibilityStatus: "eligible",
      joinedAt: now()
    };

    this.participants.push(participant);
    return participant;
  }

  addMessage(input: Omit<Message, "id" | "contentHash" | "createdAt">): Message {
    const message: Message = {
      ...input,
      id: randomUUID(),
      contentHash: hashPayload(input.content),
      createdAt: now()
    };

    this.messages.push(message);
    return message;
  }

  addFragment(input: Omit<InformationFragment, "id" | "contentHash" | "createdAt">): InformationFragment {
    const fragment: InformationFragment = {
      ...input,
      id: randomUUID(),
      contentHash: hashPayload(input.content),
      createdAt: now()
    };

    this.fragments.push(fragment);
    return fragment;
  }

  addConsent(input: Omit<Consent, "id" | "createdAt">): Consent {
    const consent: Consent = {
      ...input,
      id: randomUUID(),
      createdAt: now()
    };

    this.consents.push(consent);
    return consent;
  }

  addVote(input: Omit<Vote, "id" | "voteHash" | "createdAt">): Vote {
    const vote: Vote = {
      ...input,
      id: randomUUID(),
      voteHash: hashPayload(input.votePayload),
      createdAt: now()
    };

    this.votes.push(vote);
    return vote;
  }
}
