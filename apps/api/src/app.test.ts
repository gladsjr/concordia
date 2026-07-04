import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("Concordia API", () => {
  it("cria uma pauta em estado draft", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/topics")
      .send({
        title: "Uso de espaco comum",
        description: "Decidir como a comunidade deve usar uma sala compartilhada.",
        deliberativeQuestion: "Qual uso deve ser priorizado para a sala compartilhada?"
      });

    expect(response.status).toBe(201);
    expect(response.body.topic.status).toBe("draft");
    expect(response.body.topic.decisionPolicy).toBe("approval");
  });

  it("extrai fragmentos ao receber mensagem do usuario", async () => {
    const app = createApp();
    const topicResponse = await request(app)
      .post("/topics")
      .send({
        title: "Politica de bolsas",
        description: "Definir criterios para distribuicao de bolsas em uma turma.",
        deliberativeQuestion: "Quais criterios devem orientar a distribuicao?"
      });

    const response = await request(app)
      .post(`/topics/${topicResponse.body.topic.id}/messages`)
      .send({
        content: "Prefiro priorizar necessidade financeira. Nao aceito criterios sem transparencia.",
        visibilityScope: "private_user_agent"
      });

    expect(response.status).toBe(201);
    expect(response.body.fragments).toHaveLength(2);
    expect(response.body.agentMessage.content).toContain("consentimento");
  });
});
