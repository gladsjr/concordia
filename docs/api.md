# API inicial

## Saude

- `GET /health`

## Pautas

- `POST /topics`
- `GET /topics`
- `GET /topics/:topicId`
- `POST /topics/:topicId/publish`
- `POST /topics/:topicId/status`
- `POST /topics/:topicId/join`
- `GET /topics/:topicId/summary`

## Entrevista

- `POST /topics/:topicId/messages`
- `GET /topics/:topicId/messages`

Quando `LLM_PROVIDER=openai`, o envio de mensagens aciona a OpenAI para extrair fragmentos informacionais estruturados. Quando `LLM_PROVIDER=mock`, a extracao usa regras locais deterministicas.

## Consentimentos

- `POST /topics/:topicId/consents`

## Votacao

- `GET /topics/:topicId/recommendation`
- `POST /topics/:topicId/vote`

## Simulacao

- `POST /topics/:topicId/simulations`
- `GET /topics/:topicId/simulations/latest`

A simulacao cria participantes ficticios, partidos dinamicos, uma rodada de negociacao e alternativas finais. Ela nao substitui multiusuario real: e um modo de demonstracao para explorar como o protocolo se comportaria com varios agentes.

## Auditoria

- `GET /topics/:topicId/audit-events`

## Rotas ainda planejadas

- partidos dinamicos;
- negociacoes internas;
- negociacoes entre partidos;
- propostas e contrapropostas;
- apuracao formal de votos;
- ancoragem criptografica.
