import type { AuditEvent, Message, SimulationRun, Topic } from "../../../packages/domain/src/index";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function listTopics() {
  return request<{ topics: Topic[] }>("/topics");
}

export function createTopic(payload: {
  title: string;
  description: string;
  deliberativeQuestion: string;
}) {
  return request<{ topic: Topic }>("/topics", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function publishTopic(topicId: string) {
  return request<{ topic: Topic }>(`/topics/${topicId}/publish`, {
    method: "POST"
  });
}

export function getTopicSummary(topicId: string) {
  return request<{ summary: string; interviewPrompt: string }>(`/topics/${topicId}/summary`);
}

export function listMessages(topicId: string) {
  return request<{ messages: Message[] }>(`/topics/${topicId}/messages`);
}

export function sendMessage(topicId: string, content: string) {
  return request<{ message: Message; agentMessage: Message }>(`/topics/${topicId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content,
      visibilityScope: "private_user_agent"
    })
  });
}

export function getLatestSimulation(topicId: string) {
  return request<{ simulation: SimulationRun | null }>(`/topics/${topicId}/simulations/latest`);
}

export function runSimulation(topicId: string, participantCount: number) {
  return request<{ simulation: SimulationRun }>(`/topics/${topicId}/simulations`, {
    method: "POST",
    body: JSON.stringify({ participantCount })
  });
}

export function listAuditEvents(topicId: string) {
  return request<{ events: AuditEvent[] }>(`/topics/${topicId}/audit-events`);
}
