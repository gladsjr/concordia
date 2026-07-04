# Arquitetura inicial

## Decisao de escopo

A primeira versao e centralizada. Ela nao implementa descentralizacao, blockchain, agentes remotos nem identidade criptografica completa. Em vez disso, cria interfaces e modulos separados para que esses pontos possam evoluir sem reescrever o produto inteiro.

## Componentes

### Frontend web

Interface para criacao de pautas, descoberta, conversa com agente, resumo e auditoria.

### Backend da aplicacao

API HTTP com validacao de entrada, controle de fluxo da pauta, armazenamento temporario em memoria e emissao de eventos auditaveis.

### Runtime de agentes

Nesta base inicial, o agente e uma classe local com comportamento deterministico. O contrato ja separa as funcoes principais:

- resumir pauta;
- gerar roteiro de entrevista;
- extrair fragmentos informacionais;
- preparar recomendacao preliminar.

### VisibilityService

Modulo responsavel por decidir quais mensagens ou fragmentos podem ser exibidos a um usuario. Ele deve evoluir antes de qualquer persistencia real, porque privacidade seletiva e central no protocolo.

### AuditLogService

Registra eventos com hash do payload e encadeamento pelo hash anterior. A implementacao atual usa memoria local, mas o formato ja prepara exportacao, raiz de Merkle e ancoragem futura.

## Proximas decisoes tecnicas

- Escolher banco de dados inicial, provavelmente PostgreSQL.
- Escolher autenticacao inicial.
- Definir provedor de IA via interface `LLMProvider`.
- Trocar armazenamento em memoria por repositorios persistentes.
- Separar testes de unidade dos testes HTTP.

