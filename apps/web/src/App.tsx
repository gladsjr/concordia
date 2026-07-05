import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  GitBranch,
  Handshake,
  MessageSquareText,
  Plus,
  RadioTower,
  Send,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import type { AuditEvent, Message, SimulationRun, Topic } from "../../../packages/domain/src/index";
import {
  createTopic,
  getLatestSimulation,
  getTopicSummary,
  listAuditEvents,
  listMessages,
  listTopics,
  publishTopic,
  runSimulation,
  sendMessage
} from "./api";

type LoadState = "idle" | "loading" | "error";

export function App() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [simulation, setSimulation] = useState<SimulationRun | null>(null);
  const [summary, setSummary] = useState("");
  const [interviewPrompt, setInterviewPrompt] = useState("");
  const [topicForm, setTopicForm] = useState({
    title: "",
    description: "",
    deliberativeQuestion: ""
  });
  const [messageDraft, setMessageDraft] = useState("");
  const [simulationCount, setSimulationCount] = useState(6);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId),
    [selectedTopicId, topics]
  );
  const partiesById = useMemo(
    () => new Map(simulation?.parties.map((party) => [party.id, party.name]) ?? []),
    [simulation]
  );

  useEffect(() => {
    refreshTopics();
  }, []);

  useEffect(() => {
    if (!selectedTopicId) {
      return;
    }

    refreshTopicDetail(selectedTopicId);
  }, [selectedTopicId]);

  async function refreshTopics() {
    setLoadState("loading");
    try {
      const response = await listTopics();
      setTopics(response.topics);
      setSelectedTopicId((current) => current ?? response.topics[0]?.id);
      setLoadState("idle");
    } catch {
      setLoadState("error");
    }
  }

  async function refreshTopicDetail(topicId: string) {
    const [summaryResponse, messagesResponse, auditResponse, simulationResponse] = await Promise.all([
      getTopicSummary(topicId),
      listMessages(topicId),
      listAuditEvents(topicId),
      getLatestSimulation(topicId)
    ]);

    setSummary(summaryResponse.summary);
    setInterviewPrompt(summaryResponse.interviewPrompt);
    setMessages(messagesResponse.messages);
    setAuditEvents(auditResponse.events);
    setSimulation(simulationResponse.simulation);
  }

  async function handleCreateTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await createTopic(topicForm);
    setTopics((current) => [response.topic, ...current]);
    setSelectedTopicId(response.topic.id);
    setSimulation(null);
    setTopicForm({ title: "", description: "", deliberativeQuestion: "" });
  }

  async function handlePublish() {
    if (!selectedTopic) {
      return;
    }

    const response = await publishTopic(selectedTopic.id);
    setTopics((current) => current.map((topic) => (topic.id === response.topic.id ? response.topic : topic)));
    await refreshTopicDetail(selectedTopic.id);
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTopic || !messageDraft.trim()) {
      return;
    }

    await sendMessage(selectedTopic.id, messageDraft.trim());
    setMessageDraft("");
    await refreshTopicDetail(selectedTopic.id);
  }

  async function handleRunSimulation() {
    if (!selectedTopic) {
      return;
    }

    setIsSimulating(true);
    try {
      const response = await runSimulation(selectedTopic.id, simulationCount);
      setSimulation(response.simulation);
      setTopics((current) =>
        current.map((topic) =>
          topic.id === selectedTopic.id ? { ...topic, status: "proposal_synthesis" } : topic
        )
      );
      await refreshTopicDetail(selectedTopic.id);
    } finally {
      setIsSimulating(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <RadioTower size={24} aria-hidden="true" />
          <div>
            <strong>Concordia</strong>
            <span>deliberacao assistida</span>
          </div>
        </div>

        <form className="topic-form" onSubmit={handleCreateTopic}>
          <label>
            Titulo
            <input
              value={topicForm.title}
              onChange={(event) => setTopicForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Ex.: uso do espaco comum"
              required
              minLength={3}
            />
          </label>
          <label>
            Descricao
            <textarea
              value={topicForm.description}
              onChange={(event) => setTopicForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Contexto da decisao"
              required
              minLength={10}
            />
          </label>
          <label>
            Pergunta deliberativa
            <textarea
              value={topicForm.deliberativeQuestion}
              onChange={(event) =>
                setTopicForm((current) => ({ ...current, deliberativeQuestion: event.target.value }))
              }
              placeholder="O que precisa ser decidido?"
              required
              minLength={5}
            />
          </label>
          <button className="primary-button" type="submit">
            <Plus size={16} aria-hidden="true" />
            Criar pauta
          </button>
        </form>

        <section className="topic-list" aria-label="Pautas">
          <div className="section-title">
            <ClipboardList size={16} aria-hidden="true" />
            <span>Pautas</span>
          </div>
          {loadState === "error" ? <p className="muted">API indisponivel.</p> : null}
          {topics.map((topic) => (
            <button
              className={topic.id === selectedTopicId ? "topic-item active" : "topic-item"}
              key={topic.id}
              onClick={() => setSelectedTopicId(topic.id)}
              type="button"
            >
              <span>{topic.title}</span>
              <small>{topic.status}</small>
            </button>
          ))}
        </section>
      </aside>

      <section className="workspace">
        {selectedTopic ? (
          <>
            <header className="topic-header">
              <div>
                <span className="eyebrow">{selectedTopic.status}</span>
                <h1>{selectedTopic.title}</h1>
                <p>{selectedTopic.description}</p>
              </div>
              <button className="secondary-button" onClick={handlePublish} type="button">
                <CheckCircle2 size={16} aria-hidden="true" />
                Publicar
              </button>
            </header>

            <section className="simulation-toolbar">
              <div>
                <div className="section-title">
                  <Sparkles size={16} aria-hidden="true" />
                  <span>Simulacao multiagente</span>
                </div>
                <p>Gere participantes ficticios, partidos dinamicos e uma rodada de negociacao.</p>
              </div>
              <div className="simulation-actions">
                <label>
                  Participantes
                  <input
                    max={10}
                    min={3}
                    type="number"
                    value={simulationCount}
                    onChange={(event) => setSimulationCount(Number(event.target.value))}
                  />
                </label>
                <button className="primary-button" disabled={isSimulating} onClick={handleRunSimulation} type="button">
                  <Sparkles size={16} aria-hidden="true" />
                  {isSimulating ? "Simulando..." : "Simular negociacao"}
                </button>
              </div>
            </section>

            {simulation ? (
              <section className="simulation-grid">
                <div className="panel simulation-panel">
                  <div className="section-title">
                    <Users size={16} aria-hidden="true" />
                    <span>Participantes</span>
                  </div>
                  <div className="participant-list">
                    {simulation.participants.map((participant) => (
                      <article className="participant-card" key={participant.id}>
                        <div>
                          <strong>{participant.displayName}</strong>
                          <small>{partiesById.get(participant.partyId) ?? "Sem partido"}</small>
                        </div>
                        <p>{participant.stance}</p>
                        <dl>
                          <div>
                            <dt>Motivacao</dt>
                            <dd>{participant.motivation}</dd>
                          </div>
                          <div>
                            <dt>Limite</dt>
                            <dd>{participant.constraint}</dd>
                          </div>
                          <div>
                            <dt>Concessao</dt>
                            <dd>{participant.concession}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="panel simulation-panel">
                  <div className="section-title">
                    <GitBranch size={16} aria-hidden="true" />
                    <span>Partidos</span>
                  </div>
                  <div className="party-list">
                    {simulation.parties.map((party) => (
                      <article className="party-card" key={party.id}>
                        <strong>{party.name}</strong>
                        <p>{party.description}</p>
                        <small>{party.formationReason}</small>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="panel simulation-panel wide">
                  <div className="section-title">
                    <Handshake size={16} aria-hidden="true" />
                    <span>Negociacao</span>
                  </div>
                  <p>{simulation.negotiationRound.summary}</p>
                  <div className="proposal-highlight">{simulation.negotiationRound.compromiseProposal}</div>
                  <div className="simulation-columns">
                    <div>
                      <strong>Tensoes</strong>
                      <ul>
                        {simulation.negotiationRound.tensions.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Pendencias</strong>
                      <ul>
                        {simulation.negotiationRound.unresolvedIssues.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="panel simulation-panel wide">
                  <div className="section-title">
                    <ClipboardList size={16} aria-hidden="true" />
                    <span>Alternativas finais</span>
                  </div>
                  <div className="proposal-list">
                    {simulation.proposals.map((proposal) => (
                      <article className="proposal-card" key={proposal.id}>
                        <strong>{proposal.title}</strong>
                        <p>{proposal.description}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <div className="content-grid">
              <section className="panel">
                <div className="section-title">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>Resumo do agente</span>
                </div>
                <p>{summary}</p>
                <pre className="prompt">{interviewPrompt}</pre>
              </section>

              <section className="panel">
                <div className="section-title">
                  <Eye size={16} aria-hidden="true" />
                  <span>Auditoria</span>
                </div>
                <div className="audit-list">
                  {auditEvents.map((event) => (
                    <div className="audit-row" key={event.id}>
                      <strong>{event.eventType}</strong>
                      <code>{event.eventHash.slice(0, 14)}</code>
                    </div>
                  ))}
                  {auditEvents.length === 0 ? <p className="muted">Nenhum evento registrado.</p> : null}
                </div>
              </section>
            </div>

            <section className="conversation">
              <div className="section-title">
                <MessageSquareText size={16} aria-hidden="true" />
                <span>Entrevista assincrona</span>
              </div>
              <div className="message-list">
                {messages.map((message) => (
                  <article className={`message ${message.senderType}`} key={message.id}>
                    <span>{message.senderType === "user" ? "Voce" : "Agente"}</span>
                    <p>{message.content}</p>
                    <small>{message.visibilityScope}</small>
                  </article>
                ))}
                {messages.length === 0 ? <p className="muted">Envie a primeira resposta ao agente.</p> : null}
              </div>
              <form className="message-form" onSubmit={handleSendMessage}>
                <textarea
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder="Descreva sua posicao, motivacoes, limites e concessoes possiveis."
                />
                <button className="primary-button icon-button" type="submit" aria-label="Enviar mensagem">
                  <Send size={18} aria-hidden="true" />
                </button>
              </form>
            </section>
          </>
        ) : (
          <div className="empty-state">
            <ClipboardList size={32} aria-hidden="true" />
            <h1>Crie a primeira pauta</h1>
            <p>O fluxo inicial comeca com uma pergunta deliberativa clara.</p>
          </div>
        )}
      </section>
    </main>
  );
}
