# Data model — Planejador BNCC

## User

`id` UUID; `email` lowercase unique; `passwordHash` Argon2id; `displayName`;
`createdAt`/`updatedAt`. Relações: sessões, planos e execuções de IA.

## Session

`id`; `userId` FK indexado; `refreshTokenHash` unique; `lastSeenAt`; `expiresAt`
(janela de inatividade de 8 h); `revokedAt` nullable; `createdAt`. Só o hash é
persistido. Refresh válido exige hash não revogado/expirado e rotação revoga o
anterior.

## BnccSkill

`id`; `nivel`; `ano` inteiro nullable; `eixo`; `codigo` unique; `descricao`;
`explicacao`; `exemplos`; timestamps. Índices por código, nível/ano/eixo e busca
textual inicial com `ILIKE`.

## GenerationRequest (transitório)

`skillCodes` não vazio e existentes; `instruction` não vazia após trim;
`durationMinutes` inteiro > 0; `digitalResources` boolean; `requestId` UUID.
Não precisa ser tabela.

## AiRun

`id`; `userId`; `requestId` unique; `inputSnapshot` JSON validado somente com a
solicitação; `status` `PENDING|SUCCEEDED|FAILED`; `provider` `n8n|mock`;
`errorCode` nullable sem segredo; timestamps; relação opcional com Plan.

## Plan e PlanSkill

`Plan`: `id`; `ownerId`; `aiRunId` unique; `title`; `markdown`; `status` somente
`RASCUNHO`; `aiAssisted`; `version`; `createdAt`; `updatedAt`; `lastSavedAt`.
`PlanSkill` é a relação N:N com `BnccSkill` e preserva códigos selecionados.

`AiRun` transita `PENDING → SUCCEEDED` (cria Plan na mesma transação) ou
`PENDING → FAILED` (sem Plan). Nova tentativa cria outro AiRun. PATCH de Plan
exige `version` atual, incrementa-a e retorna `409 STALE_VERSION` se desatualizada.

Toda consulta inclui `ownerId = authenticatedUser.id`; inexistente ou alheio é
404. Não há deleção/admin neste escopo.
