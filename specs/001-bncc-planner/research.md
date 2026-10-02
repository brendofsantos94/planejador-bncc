# Research — Planejador BNCC

## Stack e versões

- **Decision:** Node.js 22.23.x LTS, pnpm 12.x, Next.js 16.3.8, React 19.2.x,
  TypeScript 5.9.x, NestJS 11.x, Prisma ORM 7.10.0 e PostgreSQL 16.15.
- **Rationale:** Node 22 é LTS e satisfaz Nest/pnpm; Next 16.3.8 é Active LTS.
  Prisma 8 é release candidate e altera o CLI/cliente; Prisma 7.10.0 permanece
  estável/suportado para migrations. PostgreSQL 16.15 é suportado até 2028.
- **Alternatives:** Next 15 (Maintenance LTS), Node 24, Prisma 8 RC e PostgreSQL
  18; rejeitados por não reduzirem risco deste primeiro plano.
- **Sources:** [Next.js support](https://nextjs.org/support-policy),
  [NestJS prerequisites](https://docs.nestjs.com/first-steps),
  [Node releases](https://nodejs.org/en/about/previous-releases),
  [pnpm compatibility](https://pnpm.io/installation/),
  [Prisma status](https://www.prisma.io/docs/orm/release-status),
  [PostgreSQL versioning](https://www.postgresql.org/support/versioning/).

## Integração n8n

- **Decision:** adapter HTTP somente na API, `POST` para `N8N_WEBHOOK_URL`,
  headers `X-API-Key` de `N8N_API_KEY`, `Content-Type` e `X-Request-Id`. Timeout
  configurável, padrão 60 s, sem retry. O corpo mantém exatamente os cinco
  campos de `docs/contracts/n8n.md`; múltiplas habilidades viram uma string,
  uma por linha `CÓDIGO — descrição`.
- **Rationale:** preserva o contrato confirmado e mantém segredo fora do web;
  mock local evita consumir o workflow compartilhado.
- **Pending value:** URL e chave de produção permanecem em ambiente, não neste repo.

## Auth, sessão e atomicidade

- **Decision:** access JWT curto (15 min) só em memória; refresh rotacionável em
  cookie HttpOnly SameSite=Lax e Secure em produção; apenas hashes Argon2id de
  senha/refresh persistidos. Sessão expira após 8 h de inatividade. Origin/CSRF
  é verificado nas operações baseadas em cookie; queries de plano filtram `ownerId`
  e plano alheio responde 404.
- **Decision:** DTOs e resposta n8n estritos. Em sucesso, `AiRun=SUCCEEDED` e
  `Plan=RASCUNHO` na mesma transação. Timeout, não-2xx ou resposta inválida marca
  `AiRun=FAILED` sem criar Plan; retry é sempre manual.

## Design e catálogo

- **Decision:** reutilizar tokens/componentes em `docs/design/design-reference.md`.
  Mobile: navegação lateral vira menu, tabela vira cartões e filtros empilham;
  tablet usa duas colunas fluidas; desktop preserva os frames. Testar foco e AA.
- **Known gap:** `docs/data/bncc-recorte.json` contém **5** habilidades, mas FR-005
  exige 8. Não inventar dados: antes da implementação, autorizar três registros
  adicionais ou alterar FR-005; até lá os cinco são a fonte de seed.
- Não há frame de expiração, acesso cruzado ou conflito de versão; esses estados
  serão cobertos por testes e mensagens acessíveis, sem alegar confirmação visual.
