# Arquitetura inicial

## Decisao de escopo

A primeira versao e centralizada. Ela nao implementa descentralizacao, blockchain, agentes remotos nem identidade criptografica completa. Em vez disso, cria interfaces e modulos separados para que esses pontos possam evoluir sem reescrever o produto inteiro.

## Componentes

### Frontend web

Interface para criacao de pautas, descoberta, conversa com agente, resumo e auditoria.

### Backend da aplicacao

API HTTP com validacao de entrada, controle de fluxo da pauta, armazenamento temporario em memoria e emissao de eventos auditaveis.

### Runtime de agentes

O agente usa uma interface `LLMProvider`. Por padrao, o provider e `mock`, para testes e desenvolvimento sem custo. Quando `LLM_PROVIDER=openai`, a API usa o SDK oficial da OpenAI e le a chave de `OPENAI_API_KEY`.

O contrato separa as funcoes principais:

- resumir pauta;
- gerar roteiro de entrevista;
- extrair fragmentos informacionais;
- preparar recomendacao preliminar.

Providers atuais:

- `MockLLMProvider`: deterministico, usado por padrao.
- `OpenAILLMProvider`: usa a Responses API da OpenAI.

Essa separacao preserva a independencia de fornecedor prevista na especificacao e permite adicionar Anthropic ou outro provedor depois sem alterar as rotas.

### Simulacao multiagente

O MVP inclui um modo de simulacao para uma pauta. O coordenador gera participantes ficticios, posicoes, restricoes, concessoes, partidos dinamicos, uma rodada de negociacao e propostas finais.

Essa simulacao serve para demonstrar o ciclo deliberativo antes de implementar multiusuario real. Os participantes simulados sao gravados como usuarios locais ficticios, mensagens agregadas, fragmentos informacionais, partidos, propostas e eventos auditaveis.

### VisibilityService

Modulo responsavel por decidir quais mensagens ou fragmentos podem ser exibidos a um usuario. Ele deve evoluir antes de qualquer persistencia real, porque privacidade seletiva e central no protocolo.

### AuditLogService

Registra eventos com hash do payload e encadeamento pelo hash anterior. A implementacao atual usa memoria local, mas o formato ja prepara exportacao, raiz de Merkle e ancoragem futura.

## Proximas decisoes tecnicas

- Escolher banco de dados inicial, provavelmente PostgreSQL.
- Escolher autenticacao inicial.
- Expandir `LLMProvider` para multiplos fornecedores.
- Trocar armazenamento em memoria por repositorios persistentes.
- Separar testes de unidade dos testes HTTP.
