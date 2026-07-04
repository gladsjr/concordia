import cors from "cors";
import express from "express";
import { z } from "zod";
import { decisionMechanisms, topicStatuses, visibilityScopes } from "../../../packages/domain/src/index.js";
import { AgentRuntime } from "./services/agents.js";
import { AuditLogService } from "./services/auditLog.js";
import { createLLMProvider } from "./services/llm/factory.js";
import { VisibilityService } from "./services/visibility.js";
import { InMemoryStore } from "./store.js";

const userId = "user-demo";

const createTopicSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  deliberativeQuestion: z.string().min(5),
  visibility: z.enum(visibilityScopes).optional(),
  decisionPolicy: z.enum(decisionMechanisms).optional()
});

const createMessageSchema = z.object({
  content: z.string().min(1),
  visibilityScope: z.enum(visibilityScopes).default("private_user_agent")
});

const consentSchema = z.object({
  fragmentId: z.string().min(1),
  fromScope: z.enum(visibilityScopes),
  toScope: z.enum(visibilityScopes),
  purpose: z.string().min(3),
  granted: z.boolean(),
  expiresAt: z.string().datetime().optional()
});

const voteSchema = z.object({
  proposalId: z.string().default("proposal-demo"),
  voteType: z.enum(decisionMechanisms),
  votePayload: z.record(z.unknown())
});

export function createApp() {
  const store = new InMemoryStore();
  const auditLog = new AuditLogService();
  const visibility = new VisibilityService();
  const agents = new AgentRuntime(createLLMProvider());
  const app = express();

  app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "concordia-api" });
  });

  app.get("/topics", (_request, response) => {
    response.json({ topics: store.topics });
  });

  app.post("/topics", (request, response) => {
    const payload = createTopicSchema.parse(request.body);
    const topic = store.createTopic(payload);
    auditLog.record({
      topicId: topic.id,
      eventType: "topic_created",
      actorType: "user",
      actorId: topic.creatorUserId,
      payload: topic,
      visibilityScope: topic.visibility
    });

    response.status(201).json({ topic });
  });

  app.get("/topics/:topicId", (request, response) => {
    const topic = store.topics.find((item) => item.id === request.params.topicId);
    if (!topic) {
      response.status(404).json({ error: "topic_not_found" });
      return;
    }

    response.json({
      topic,
      participants: store.participants.filter((participant) => participant.topicId === topic.id),
      fragments: store.fragments.filter((fragment) => {
        const message = store.messages.find((item) => item.id === fragment.sourceMessageId);
        return message?.topicId === topic.id;
      })
    });
  });

  app.post("/topics/:topicId/publish", (request, response) => {
    const topic = store.updateTopic(request.params.topicId, { status: "published" });
    if (!topic) {
      response.status(404).json({ error: "topic_not_found" });
      return;
    }

    auditLog.record({
      topicId: topic.id,
      eventType: "topic_published",
      actorType: "coordinator_agent",
      actorId: topic.coordinatorAgentId,
      payload: { topicId: topic.id, status: topic.status }
    });

    response.json({ topic });
  });

  app.post("/topics/:topicId/status", (request, response) => {
    const status = z.enum(topicStatuses).parse(request.body.status);
    const topic = store.updateTopic(request.params.topicId, { status });
    if (!topic) {
      response.status(404).json({ error: "topic_not_found" });
      return;
    }

    auditLog.record({
      topicId: topic.id,
      eventType: "topic_status_changed",
      actorType: "coordinator_agent",
      actorId: topic.coordinatorAgentId,
      payload: { topicId: topic.id, status }
    });

    response.json({ topic });
  });

  app.post("/topics/:topicId/join", (request, response) => {
    const topic = store.topics.find((item) => item.id === request.params.topicId);
    if (!topic) {
      response.status(404).json({ error: "topic_not_found" });
      return;
    }

    const participant = store.joinTopic(topic.id, userId);
    auditLog.record({
      topicId: topic.id,
      eventType: "participant_joined",
      actorType: "user",
      actorId: participant.userId,
      payload: participant
    });

    response.status(201).json({ participant });
  });

  app.get("/topics/:topicId/summary", async (request, response) => {
    const topic = store.topics.find((item) => item.id === request.params.topicId);
    if (!topic) {
      response.status(404).json({ error: "topic_not_found" });
      return;
    }

    const summary = await agents.summarizeTopicForUser(topic);
    response.json(summary);
  });

  app.get("/topics/:topicId/messages", (request, response) => {
    const participants = store.participants.filter((participant) => participant.topicId === request.params.topicId);
    const messages = store.messages
      .filter((message) => message.topicId === request.params.topicId)
      .filter((message) => visibility.canReadMessage({ userId, message, participants }));

    response.json({ messages });
  });

  app.post("/topics/:topicId/messages", async (request, response) => {
    const topic = store.topics.find((item) => item.id === request.params.topicId);
    if (!topic) {
      response.status(404).json({ error: "topic_not_found" });
      return;
    }

    const payload = createMessageSchema.parse(request.body);
    const message = store.addMessage({
      topicId: topic.id,
      senderType: "user",
      senderId: userId,
      recipientType: "user_agent",
      recipientId: `agent-${userId}`,
      content: payload.content,
      visibilityScope: payload.visibilityScope
    });

    const fragments = (await agents.extractInformationFragments(message, userId)).map((fragment) =>
      store.addFragment(fragment)
    );

    const agentMessage = store.addMessage({
      topicId: topic.id,
      senderType: "user_agent",
      senderId: `agent-${userId}`,
      recipientType: "user",
      recipientId: userId,
      content: `Registrei ${fragments.length} fragmento(s) e vou pedir consentimento antes de ampliar qualquer escopo.`,
      visibilityScope: "private_user_agent"
    });

    auditLog.record({
      topicId: topic.id,
      eventType: "message_created",
      actorType: "user",
      actorId: userId,
      payload: { messageId: message.id, content: message.content, fragmentCount: fragments.length },
      visibilityScope: message.visibilityScope
    });

    response.status(201).json({ message, fragments, agentMessage });
  });

  app.post("/topics/:topicId/consents", (request, response) => {
    const topic = store.topics.find((item) => item.id === request.params.topicId);
    if (!topic) {
      response.status(404).json({ error: "topic_not_found" });
      return;
    }

    const payload = consentSchema.parse(request.body);
    const consent = store.addConsent({ userId, ...payload });
    auditLog.record({
      topicId: topic.id,
      eventType: "consent_recorded",
      actorType: "user",
      actorId: userId,
      payload: consent,
      visibilityScope: "cryptographic_commitment_only"
    });

    response.status(201).json({ consent });
  });

  app.get("/topics/:topicId/recommendation", async (request, response) => {
    const topic = store.topics.find((item) => item.id === request.params.topicId);
    if (!topic) {
      response.status(404).json({ error: "topic_not_found" });
      return;
    }

    response.json({ recommendation: await agents.prepareVoteRecommendation(topic), confidence: 0.35 });
  });

  app.post("/topics/:topicId/vote", (request, response) => {
    const topic = store.topics.find((item) => item.id === request.params.topicId);
    if (!topic) {
      response.status(404).json({ error: "topic_not_found" });
      return;
    }

    const payload = voteSchema.parse(request.body);
    const vote = store.addVote({ topicId: topic.id, userId, ...payload });
    auditLog.record({
      topicId: topic.id,
      eventType: "vote_recorded",
      actorType: "user",
      actorId: userId,
      payload: { voteId: vote.id, voteHash: vote.voteHash },
      visibilityScope: "cryptographic_commitment_only"
    });

    response.status(201).json({ vote });
  });

  app.get("/topics/:topicId/audit-events", (request, response) => {
    response.json({ events: auditLog.list(request.params.topicId) });
  });

  return app;
}
