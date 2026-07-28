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
  getHealth,
  getTopicSummary,
  listAuditEvents,
  listMessages,
  listTopics,
  publishTopic,
  runSimulation,
  sendMessage
} from "./api";

type LoadState = "idle" | "loading" | "error";
type RuntimeInfo = Awaited<ReturnType<typeof getHealth>>["llm"];

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
  const [roundCount, setRoundCount] = useState(2);
  const [visibleNegotiationMessageCount, setVisibleNegotiationMessageCount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string>();
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo>();

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId),
    [selectedTopicId, topics]
  );
  const partiesById = useMemo(
    () => new Map(simulation?.parties.map((party) => [party.id, party.name]) ?? []),
    [simulation]
  );
  const participantNamesByUserId = useMemo(
    () => new Map(simulation?.participants.map((participant) => [participant.userId, participant.displayName]) ?? []),
    [simulation]
  );
  const privateInterviewMessages = useMemo(
    () => messages.filter((message) => message.conversationType === "private_interview"),
    [messages]
  );
  const visibleNegotiationMessages = useMemo(
    () => simulation?.publicNegotiationMessages.slice(0, visibleNegotiationMessageCount) ?? [],
    [simulation, visibleNegotiationMessageCount]
  );
  const isRevealingSimulation = Boolean(
    simulation && visibleNegotiationMessageCount < simulation.publicNegotiationMessages.length
  );
  const isSimulationDisplayComplete = Boolean(
    simulation && visibleNegotiationMessageCount >= simulation.publicNegotiationMessages.length
  );

  useEffect(() => {
    refreshTopics();
    refreshRuntimeInfo();
  }, []);

  useEffect(() => {
    if (!selectedTopicId) {
      return;
    }

    refreshTopicDetail(selectedTopicId);
  }, [selectedTopicId]);

  useEffect(() => {
    if (!simulation) {
      setVisibleNegotiationMessageCount(0);
      return;
    }

    setVisibleNegotiationMessageCount(0);
    const timer = window.setInterval(() => {
      setVisibleNegotiationMessageCount((current) => {
        if (current >= simulation.publicNegotiationMessages.length) {
          window.clearInterval(timer);
          return current;
        }

        return current + 1;
      });
    }, 520);

    return () => window.clearInterval(timer);
  }, [simulation?.id]);

  async function refreshRuntimeInfo() {
    try {
      const response = await getHealth();
      setRuntimeInfo(response.llm);
    } catch {
      setRuntimeInfo(undefined);
    }
  }

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
    setSimulationError(undefined);
    setSimulation(null);
    try {
      await refreshRuntimeInfo();
      const response = await runSimulation(selectedTopic.id, simulationCount, roundCount);
      setSimulation(response.simulation);
      setTopics((current) =>
        current.map((topic) =>
          topic.id === selectedTopic.id ? { ...topic, status: "proposal_synthesis" } : topic
        )
      );
      await refreshTopicDetail(selectedTopic.id);
    } catch (error) {
      setSimulationError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel executar a negociacao."
      );
    } finally {
      await refreshRuntimeInfo();
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
                  <span>Simulacao publica</span>
                </div>
                <p>Rode uma negociacao em que participantes simulados conversam publicamente com o agente comum.</p>
                {runtimeInfo?.provider === "mock" ? (
                  <p className="runtime-warning">Runtime mock ativo: respostas sao deterministicas e servem para teste.</p>
                ) : null}
                {runtimeInfo?.provider === "openai" ? (
                  <p className="runtime-note">
                    OpenAI ativo: negociador {runtimeInfo.negotiatorModel}, simulados{" "}
                    {runtimeInfo.simulatedParticipantModel}.
                  </p>
                ) : null}
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
                <label>
                  Rodadas
                  <input
                    max={4}
                    min={1}
                    type="number"
                    value={roundCount}
                    onChange={(event) => setRoundCount(Number(event.target.value))}
                  />
                </label>
                <button className="primary-button" disabled={isSimulating} onClick={handleRunSimulation} type="button">
                  <Sparkles size={16} aria-hidden="true" />
                  {isSimulating ? "Simulando..." : "Rodar negociacao"}
                </button>
              </div>
            </section>
            {simulationError ? (
              <p className="runtime-warning" role="alert">
                {simulationError}
              </p>
            ) : null}

            {simulation ? (
              <section className="simulation-grid">
                <div className="panel simulation-panel">
                  <div className="section-title">
                    <Users size={16} aria-hidden="true" />
                    <span>Participantes simulados</span>
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
                    <span>Blocos de posicao</span>
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
                    <span>Rodada publica</span>
                  </div>
                  <p>{simulation.negotiationRound.summary}</p>
                  <small className="round-count">
                    {visibleNegotiationMessages.length} de {simulation.publicNegotiationMessages.length} mensagens publicas
                    exibidas
                  </small>
                  {isSimulationDisplayComplete ? (
                    <>
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
                    </>
                  ) : (
                    <div className="proposal-highlight">A proposta final aparece ao fim da exibicao do transcript.</div>
                  )}
                  {isRevealingSimulation ? (
                    <div className="live-indicator" aria-live="polite">
                      Negociacao em exibicao
                    </div>
                  ) : null}
                </div>

                <div className="panel simulation-panel wide">
                  <div className="section-title">
                    <MessageSquareText size={16} aria-hidden="true" />
                    <span>Transcript auditavel</span>
                  </div>
                  <div className="transcript-list">
                    {visibleNegotiationMessages.map((message) => (
                      <article className={`negotiation-message ${message.senderType}`} key={message.id}>
                        <div>
                          <strong>{formatSender(message, participantNamesByUserId)}</strong>
                          <small>
                            {message.roundNumber === 0
                              ? "posicao inicial"
                              : `rodada ${message.roundNumber ?? simulation.negotiationRound.roundNumber}`}
                          </small>
                        </div>
                        <p>{message.content}</p>
                        <code>{message.contentHash.slice(0, 14)}</code>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="panel simulation-panel wide">
                  <div className="section-title">
                    <ClipboardList size={16} aria-hidden="true" />
                    <span>Alternativas finais</span>
                  </div>
                  {isSimulationDisplayComplete ? (
                    <div className="proposal-list">
                      {simulation.proposals.map((proposal) => (
                        <article className="proposal-card" key={proposal.id}>
                          <strong>{proposal.title}</strong>
                          <p>{proposal.description}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">As alternativas finais entram depois que a rodada publica terminar.</p>
                  )}
                </div>
              </section>
            ) : null}

            {isSimulating ? (
              <section className="panel simulation-pending" aria-live="polite">
                <div className="section-title">
                  <Sparkles size={16} aria-hidden="true" />
                  <span>Negociacao em andamento</span>
                </div>
                <p>Os participantes simulados estao respondendo e o agente negociador esta consolidando a rodada.</p>
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
                <span>Entrevista privada opcional</span>
              </div>
              <div className="message-list">
                {privateInterviewMessages.map((message) => (
                  <article className={`message ${message.senderType}`} key={message.id}>
                    <span>{message.senderType === "user" ? "Voce" : "Agente"}</span>
                    <p>{message.content}</p>
                    <small>{message.visibilityScope}</small>
                  </article>
                ))}
                {privateInterviewMessages.length === 0 ? (
                  <p className="muted">Envie uma posicao privada se quiser extrair fragmentos antes de negociar.</p>
                ) : null}
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

function formatSender(message: Message, participantNamesByUserId: Map<string, string>): string {
  if (message.senderType === "negotiator_agent") {
    return "Agente negociador";
  }

  if (message.senderType === "simulated_participant") {
    return participantNamesByUserId.get(message.senderId) ?? "Participante simulado";
  }

  if (message.senderType === "user") {
    return "Voce";
  }

  return "Agente";
}
