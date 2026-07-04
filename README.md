# Concordia

Concordia e um MVP web centralizado para deliberacao humana assistida por IA.

O objetivo desta base inicial e provar o ciclo operacional da especificacao:

1. criar uma pauta;
2. publicar e descobrir a pauta;
3. conversar assincronamente com um agente representante;
4. extrair fragmentos informacionais;
5. preservar escopos de privacidade;
6. registrar eventos auditaveis;
7. preparar caminho para partidos dinamicos, negociacao e votacao.

## Estrutura

```text
apps/api      API Express, servicos de agente, privacidade e auditoria
apps/web      Interface React/Vite
packages/domain  Tipos e constantes compartilhados do protocolo
docs          Decisoes arquiteturais e backlog do MVP
```

## Como rodar

```bash
npm install
npm run dev
```

Servicos esperados:

- API: http://localhost:3333
- Web: http://localhost:5173

## Scripts

```bash
npm run typecheck
npm run test
npm run build
```

## IA

Por padrao, a API usa `LLM_PROVIDER=mock`, sem chamadas externas.

Para usar OpenAI localmente, crie um arquivo `.env` na raiz do projeto:

```env
PORT=3333
WEB_ORIGIN=http://localhost:5173
LLM_PROVIDER=openai
OPENAI_API_KEY=sua-chave-local
OPENAI_MODEL=gpt-5.5
```

O arquivo `.env` esta no `.gitignore` e nao deve ser enviado ao GitHub.

## GitHub

Este projeto foi criado localmente. A decisao de criar o repositorio no GitHub deve vir depois de escolher se ele sera publico ou privado.
