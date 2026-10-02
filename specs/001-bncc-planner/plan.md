# Implementation Plan: Planejador BNCC

**Branch**: `docs/planejamento` | **Date**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-bncc-planner/spec.md`

## Summary

Entregar um monorepo pnpm com `apps/web` (Next.js/TypeScript) e `apps/api`
(NestJS/TypeScript), apoiado por PostgreSQL em Docker Compose e Prisma. O fluxo
principal autentica professores de demonstração, filtra e seleciona múltiplas
habilidades BNCC, chama o workflow n8n pelo backend e salva atomicamente um
rascunho privado quando a resposta Markdown é válida. O frontend mantém o
access token somente em memória; o refresh token é rotacionado em cookie
HttpOnly e persistido apenas como hash. A UI reutiliza os tokens/componentes
confirmados em `docs/design/design-reference.md`, com adaptações documentadas
para tablet e celular.

## Technical Context

**Language/Version**: TypeScript 5.9.x strict; Node.js 22.23.x LTS; pnpm 12.x;
React 19.2.x; lockfile `pnpm-lock.yaml`.

**Primary Dependencies**: Next.js 16.3.8, React 19.2.x compatível com Next 16,
NestJS 11.x, Prisma ORM 7.10.0, PostgreSQL driver/adaptador, Zod nas fronteiras
HTTP, biblioteca de hash de senha/refresh, cliente HTTP nativo com AbortSignal,
CSS próprio com tokens (sem Tailwind).

**Storage**: PostgreSQL 16.15 em Docker Compose; Prisma Migrate; seed idempotente
de contas e `docs/data/bncc-recorte.json`.

**Testing**: Vitest/Jest conforme o runner escolhido por cada app; testes unitários
de validação/serviços, contrato n8n com mock local, integração API+PostgreSQL e
testes de fluxo web. Scripts raiz: `dev`, `lint`, `typecheck`, `test`,
`test:integration`, `build`.

**Target Platform**: navegador moderno em desktop/tablet/celular; API Node em
localhost:3001; web em localhost:3000; PostgreSQL local via Docker Compose.

**Project Type**: monorepo web full-stack (frontend + API + integração externa).

**Performance Goals**: respostas de catálogo/listagem em até 500 ms no ambiente
local; geração limitada a 60 s; nenhuma tentativa automática adicional; uma
transação para sucesso de geração.

**Constraints**: segredo do n8n somente na API; CORS somente para a origem web;
HTTPS+Secure em produção (localhost documenta exceção); proteção CSRF para
operações baseadas em cookie; Markdown sanitizado sem HTML arbitrário; sem
cadastro/admin/PDF/publicação/versionamento de planos.

**Scale/Scope**: duas contas locais de demonstração, catálogo inicial pequeno,
um único rascunho por solicitação, somente estado `RASCUNHO`, sem rotas
administrativas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação no plano |
|---|---|
| I. Specification Before Code | Artefatos e critérios vêm de `spec.md`; nenhuma implementação nesta fase. |
| II. Layered Architecture and Secret Handling | `apps/web` fala somente com `apps/api`; adapter n8n e `N8N_API_KEY` ficam na API. |
| III. Teacher-Scoped Authentication and Authorization | Guards validam access token; queries usam `ownerId`; plano alheio responde 404. |
| IV. Human Review of AI Output | Sucesso cria apenas `RASCUNHO`, com `aiAssisted=true`, Markdown editável e revisão explícita. |
| V. Validated and Atomic External Work | DTOs/response schema estritos; timeout 60 s; transação só cria Plan após resposta válida. |
| VI. Reproducible Persistence | Prisma migrations, seed idempotente, Compose e quickstart versionados. |
| VII. Design System, Accessibility, and Responsiveness | Tokens/componentes do Figma registrados; foco, contraste AA e regras responsivas documentadas. |
| VIII. Verified Delivery and Credential Safety | Scripts de qualidade, testes críticos, `.env.example` sem valores secretos e nenhuma credencial versionada. |

**Gate inicial: PASS**, condicionado à resolução operacional da lacuna do catálogo
registrada em `research.md` antes da implementação.

## Project Structure

### Documentation (this feature)

```text
specs/001-bncc-planner/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md              # Phase 2; não criado nesta fase
```

### Source Code (repository root)

```text
apps/
├── web/
│   ├── src/app/             # rotas e telas Next.js
│   ├── src/components/      # componentes reutilizáveis e estados do DS
│   ├── src/lib/             # cliente da API e auth em memória
│   └── tests/               # testes de componentes/fluxos
└── api/
    ├── src/modules/         # auth, bncc, plans, ai, health
    ├── prisma/              # schema, migrations e seed idempotente
    └── test/                # unitários, contrato e integração
packages/
└── shared/                  # tipos/validações não secretas compartilhadas
docker-compose.yml           # PostgreSQL local
pnpm-workspace.yaml
package.json                 # scripts raiz
```

**Structure Decision**: monorepo com fronteira explícita `web → API → adapters`
e pacote `shared` somente para contratos seguros. O schema Prisma pertence à API;
o frontend não importa Prisma nem o contrato secreto do n8n.

## Phase 0/1 outputs

- [research.md](./research.md): decisões de versões, segurança, n8n, design e lacunas.
- [data-model.md](./data-model.md): entidades, constraints e transições.
- [contracts/rest.md](./contracts/rest.md): endpoints da API para o web.
- [contracts/n8n.md](./contracts/n8n.md): corpo exato, headers de transporte e validação.
- [quickstart.md](./quickstart.md): execução local e cenários de validação.

**Gate pós-design: PASS**, pois os artefatos preservam os oito princípios; a única
pendência de produto é a reconciliação documentada entre o mínimo de oito itens de
FR-005 e os cinco registros atualmente fornecidos no JSON.

## Complexity Tracking

Nenhuma violação constitucional foi identificada; a separação web/API/adapter é
exigida pelo princípio II e pelo escopo do produto.
