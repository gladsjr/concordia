import { randomUUID } from "node:crypto";
import type { ActorType, AuditEvent, VisibilityScope } from "../../../../packages/domain/src/index.js";
import { hashPayload } from "./hash.js";

export class AuditLogService {
  private readonly events: AuditEvent[] = [];

  record(input: {
    topicId?: string;
    eventType: string;
    actorType: ActorType;
    actorId: string;
    payload: unknown;
    visibilityScope?: VisibilityScope;
  }): AuditEvent {
    const previous = this.events.at(-1);
    const payloadHash = hashPayload(input.payload);
    const createdAt = new Date().toISOString();
    const eventHash = hashPayload({
      topicId: input.topicId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId,
      payloadHash,
      previousEventHash: previous?.eventHash,
      createdAt
    });

    const event: AuditEvent = {
      id: randomUUID(),
      topicId: input.topicId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId,
      payloadHash,
      payloadRedacted: redactPayload(input.payload),
      visibilityScope: input.visibilityScope ?? "public_summary",
      previousEventHash: previous?.eventHash,
      eventHash,
      createdAt
    };

    this.events.push(event);
    return event;
  }

  list(topicId?: string): AuditEvent[] {
    if (!topicId) {
      return [...this.events];
    }

    return this.events.filter((event) => event.topicId === topicId);
  }
}

function redactPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { value: payload };
  }

  return Object.fromEntries(
    Object.entries(payload as Record<string, unknown>).map(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.includes("content") || normalizedKey.includes("message")) {
        return [key, "[redacted]"];
      }

      return [key, value];
    })
  );
}
