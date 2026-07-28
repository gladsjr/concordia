# Negociação auditável por camadas

## Objetivo

Substituir o modelo atual de agente representante como fluxo principal por um agente negociador comum. Ele negocia diretamente com pessoas e agentes simulados. A confiança vem de conversas registradas e visíveis no escopo correto.

## Caso inicial: simulação pública

- Uma pauta publicada inicia uma simulação.
- Participam você, um agente negociador e vários participantes simulados.
- Cada participante conversa diretamente com o agente negociador.
- O agente negociador tenta construir propostas que acomodem posições, limites e concessões de todos.
- Todas as conversas desse fluxo são públicas e auditáveis.
- A interface mostra a negociação acontecendo, em vez de apenas exibir um resultado pronto.
- Participantes simulados podem ser substituídos por pessoas reais sem mudar o protocolo de comunicação.

## Papéis

| Papel | Função |
|---|---|
| Participante | Expõe posição, limites, prioridades e concessões. |
| Agente negociador | Media a negociação; não representa ninguém. |
| Participante simulado | Agente que desempenha o papel de uma pessoa durante a simulação. |
| Agente representante | Opcional e futuro; age em nome de uma pessoa ou grupo. |
| Agente de partido | Opcional e futuro; consolida posições e negocia em nome do partido. |

## Regras de visibilidade

| Conversa | Quem pode ver |
|---|---|
| Participante ↔ agente negociador | Todos os participantes da pauta. |
| Participante ↔ representante individual | Apenas participante e representante. |
| Membro ↔ partido | Todos os membros do partido. |
| Agente de partido ↔ membros | Todos os membros do partido. |
| Partido ↔ outro partido ou agente negociador comum | Todos os participantes da pauta. |

Não pode existir conversa bilateral oculta entre um participante e o agente negociador comum.

## Fluxo proposto

1. Publicar a pauta.
2. Criar participantes simulados.
3. Rodar negociação pública por rodadas.
4. Exibir propostas e contrapropostas visíveis.
5. Produzir alternativas finais para decisão.

## Evolução posterior

- Permitir representantes individuais com canal privado.
- Criar partidos e deliberação interna restrita aos membros.
- Manter públicas as negociações externas dos partidos.
- Adicionar autenticação, participantes reais e controle de acesso por escopo.
