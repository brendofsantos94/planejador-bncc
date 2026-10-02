# Tasks: Planejador BNCC

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Organization**: Quatro fases solicitadas (A–D), dependentes em sequência. Os rótulos `[US1]`, `[US2]` e `[US3]` mantêm rastreabilidade às histórias da specification. A estrutura de aplicação indicada é criada do zero; nenhuma feature anterior é pressuposta.

**Nota de escopo**: `docs/data/bncc-recorte.json` fornece cinco habilidades, mas FR-005 pede oito. Não fabricar registros; obter fonte aprovada ou decisão de alteração de FR-005 antes de concluir o seed que satisfaça o aceite.

## Fase A — Monorepo, ambiente, banco, autenticação e catálogo

**Objetivo**: preparar repositório executável e estabelecer persistência, sessão segura e consulta autenticada ao catálogo.

**Critério de conclusão**: instalação reproduzível com lockfile; PostgreSQL inicia por Compose; migrations e seed idempotentes funcionam; duas contas de demonstração autenticam; expiração/logout/refresh e filtros do catálogo passam seus testes críticos. Segredo n8n não existe no bundle do web.

- [ ] T001 Criar workspace pnpm, `package.json` raiz com scripts `dev`, `lint`, `typecheck`, `test`, `test:integration` e `build`, `pnpm-workspace.yaml`, `.npmrc` e `pnpm-lock.yaml`; concluir quando os scripts apontarem para `apps/web` e `apps/api` sem depender de diretórios preexistentes.
- [x] T002 [P] Criar configuração TypeScript strict e lint compartilhada em `tsconfig.base.json`, `eslint.config.mjs` e `.prettierrc.json`; concluir quando os dois apps puderem estender uma base comum.
- [x] T003 [P] Criar `docker-compose.yml` com serviço PostgreSQL 16.15, volume nomeado e healthcheck; concluir quando `docker compose up -d postgres` disponibilizar a porta documentada sem incluir credenciais reais.
- [x] T004 [P] Criar `.gitignore` na raiz para dependências, builds, caches, cobertura, arquivos locais `.env*` (permitindo `.env.example`) e dados temporários; concluir quando segredos e artefatos gerados não forem adicionados ao Git por padrão.
- [x] T005 Criar `.env.example` raiz e `apps/api/.env.example`/`apps/web/.env.example` com nomes e valores fictícios ou vazios; concluir quando documentarem portas 3000/3001, `DATABASE_URL`, segredos de auth e variáveis n8n sem valor utilizável.
- [x] T006 Criar estrutura inicial `apps/web/{app,components,lib,tests}` e `apps/api/{src/modules,test,prisma}` mais `packages/shared/src`; concluir quando cada workspace possuir configuração mínima própria e fronteira web → API definida.
- [x] T007 Configurar Prisma ORM 7.10.0 e adaptador PostgreSQL em `apps/api/package.json`, `apps/api/prisma/schema.prisma` e `apps/api/src/database/`; concluir quando a API carregar configuração sem expor conexão ao web.
- [x] T008 Modelar `User`, `Session`, `BnccSkill`, `AiRun`, `Plan` e `PlanSkill` em `apps/api/prisma/schema.prisma`; concluir quando constraints/índices e relações seguirem [data-model.md](./data-model.md), incluindo `passwordHash`, `refreshTokenHash`, `ownerId`, `requestId` único e status definidos.
- [x] T009 Criar migration inicial versionada em `apps/api/prisma/migrations/`; concluir quando banco vazio puder receber todas as tabelas e constraints via Prisma Migrate.
- [x] T010 Implementar seed idempotente em `apps/api/prisma/seed.ts` e configuração em `apps/api/prisma.config.ts`; concluir quando duas contas locais e os cinco registros fonte de `docs/data/bncc-recorte.json` puderem ser recriados sem duplicação, registrando a pendência até catálogo aprovado chegar a oito.
- [x] T011 Implementar hashing de senha e autenticação local em `apps/api/src/modules/auth/`; concluir quando login aceitar apenas as contas seed, comparar hash seguro e nunca retornar hash ou mensagem que diferencie usuário de senha incorreta.
- [x] T012 Implementar access token curto e sessão refresh em `apps/api/src/modules/auth/` e `apps/api/prisma/schema.prisma`; concluir quando o access token tiver duração de 15 minutos, refresh token rotacionar em cookie HttpOnly, somente seu hash persistir e inatividade de oito horas expirar a sessão.
- [x] T013 Implementar CORS, cookie e CSRF/Origin em `apps/api/src/main.ts` e `apps/api/src/modules/auth/`; concluir quando CORS aceitar só a origem web configurada, refresh/logout validarem proteção CSRF e `Secure` estiver ligado em produção, com ajuste localhost documentado.
- [x] T014 Implementar refresh/logout e guardas de autenticação nos módulos `apps/api/src/modules/auth/` e `apps/api/src/common/guards/`; concluir quando rotas protegidas rejeitarem visitante, logout revogar refresh e refresh revogado/expirado não emitir sessão nova.
- [x] T015 Implementar contratos de autenticação e cliente web em `apps/api/src/modules/auth/` e `apps/web/src/lib/api/`; concluir quando login/refresh/logout seguirem [contracts/rest.md](./contracts/rest.md), access token ficar somente em memória e o web não persistir refresh token em storage acessível por JavaScript.
- [x] T016 Implementar consulta/filtros de catálogo em `apps/api/src/modules/bncc/` e DTOs em `apps/api/src/modules/bncc/dto/`; concluir quando nível, ano aplicável, eixo, código e texto puderem ser combinados, resultados vierem autenticados e `codigo` for único.
- [x] T017 Criar testes críticos de auth/sessão em `apps/api/test/auth.e2e-spec.ts` e `apps/api/src/modules/auth/*.spec.ts`; concluir quando cobrirem duas contas, senha inválida, hash persistido, refresh rotacionado, expiração após oito horas, logout e acesso sem bearer.
- [x] T018 Criar testes de catálogo e seed em `apps/api/test/bncc.e2e-spec.ts` e `apps/api/prisma/seed.spec.ts`; concluir quando cobrirem filtros combinados, ausência de resultados, códigos únicos e reexecução idempotente do seed.

## Fase B — Geração, cliente n8n, validação, AiRun e privacidade

**Objetivo**: gerar rascunhos usando o contrato confirmado e garantir atomicidade, rastreabilidade e isolamento por professor.

**Critério de conclusão**: mock e adapter HTTP obedecem ao corpo n8n confirmado; sucesso cria exatamente um rascunho e marca AiRun SUCCEEDED atomicamente; timeout, não-2xx e resposta inválida marcam FAILED sem plano parcial; plano alheio resulta em 404.

- [x] T019 [P] [US1] Definir schemas de entrada/saída e regras de conteúdo em `packages/shared/src/generation.ts` e `apps/api/src/modules/ai/`; concluir quando entrada exigir habilidades existentes não vazias, instrução não vazia, duração inteira > 0 e boolean de recursos, e saída exigir `success`, ecos coerentes, `format=markdown` e título, objetivos, atividades e avaliação.
- [x] T020 [US1] Implementar serialização do corpo n8n em `apps/api/src/modules/ai/n8n-payload.ts`; concluir quando enviar exatamente `sessao`, `habilidade`, `instrucao`, `duracao` e `recursos_digitais`, com email do professor e uma linha `CÓDIGO — descrição` por habilidade selecionada.
- [x] T021 [US1] Implementar adapter HTTP em `apps/api/src/modules/ai/n8n.client.ts`; concluir quando fizer POST a `N8N_WEBHOOK_URL`, enviar `X-API-Key` só no backend e `X-Request-Id` como header, usar timeout configurável de 60 s por padrão e não repetir automaticamente.
- [x] T022 [US1] Implementar provider mock em `apps/api/src/modules/ai/mock.client.ts` e configuração em `apps/api/src/config/`; concluir quando suportar respostas de sucesso, inválida, erro HTTP e timeout sem acessar o workflow compartilhado.
- [x] T023 [US1] Implementar validação/normalização das respostas em `apps/api/src/modules/ai/n8n-response.schema.ts`; concluir quando rejeitar campo ausente, tipo incorreto, eco divergente, seção obrigatória ausente, não-2xx e timeout sem expor conteúdo sensível.
- [x] T024 [US1] Implementar serviço de geração e transação em `apps/api/src/modules/ai/ai-runs.service.ts` e `apps/api/src/modules/plans/plans.service.ts`; concluir quando AiRun nascer PENDING e resposta válida criar Plan RASCUNHO com `aiAssisted=true` e AiRun SUCCEEDED na mesma transação; falha deixar AiRun FAILED sem Plan.
- [x] T025 [US1] Criar endpoint `POST /plans/generations` em `apps/api/src/modules/plans/` conforme `specs/001-bncc-planner/contracts/rest.md`; concluir quando exigir autenticação, retornar `requestId` e preservar erro 502/504 sem salvar plano parcial.
- [x] T026 [US1] Implementar leitura/listagem de planos em `apps/api/src/modules/plans/`; concluir quando toda query filtrar `ownerId`, lista retornar apenas planos do usuário e ID inexistente ou alheio responder 404.
- [x] T027 [US2] Implementar leitura detalhada e edição otimista em `apps/api/src/modules/plans/` e sanitização em `apps/api/src/modules/plans/markdown/`; concluir quando PATCH exigir versão atual, sanitizar Markdown sem executar HTML arbitrário, rejeitar conteúdo inválido, incrementar token de concorrência e retornar 409 `STALE_VERSION` sem manter histórico de versões.
- [x] T028 [US1] Criar testes de contrato do cliente n8n em `apps/api/src/modules/ai/n8n.client.spec.ts` e `apps/api/src/modules/ai/n8n-response.schema.spec.ts`; concluir quando verificarem payload exato com múltiplas habilidades, headers, timeout, ausência de retry e todas as respostas inválidas.
- [ ] T029 [US1] Criar testes de integração de geração em `apps/api/test/generation.e2e-spec.ts`; concluir quando confirmarem criação única atômica no sucesso e AiRun FAILED sem Plan em falha, resposta inválida e timeout.
- [ ] T030 [US2] Criar testes de autorização/conflito em `apps/api/test/plans-privacy.e2e-spec.ts`; concluir quando duas contas demonstrarem isolamento de listagem, leitura e gravação (404 cruzado) e rejeição do salvamento com versão obsoleta (409).

## Fase C — Telas Figma, estados, lista e editor

**Objetivo**: implementar o fluxo visual aprovado, acessível e responsivo de geração e revisão.

**Critério de conclusão**: login, catálogo, geração, lista, estado vazio e editor refletem frames e tokens documentados; erros mantêm dados e permitem retry manual; preview sanitiza Markdown; tablet/celular não perdem controles essenciais nem geram rolagem horizontal.

- [ ] T031 [P] [US1] Criar tokens CSS e componentes base em `apps/web/src/app/globals.css` e `apps/web/src/components/ui/`; concluir quando cores, tipografia, espaçamento, raios, botões, inputs, chips, badges, alertas, carregamento e foco seguirem `docs/design/design-reference.md` sem Tailwind.
- [ ] T032 [US3] Implementar tela de login e estados de validação em `apps/web/src/app/login/page.tsx` e `apps/web/src/components/auth/`; concluir quando representar login inválido, duas contas de demonstração, erros associados aos campos e navegação protegida segundo os frames aprovados.
- [ ] T033 [US1] Implementar navegação autenticada, logout e menu responsivo em `apps/web/src/components/layout/` e `apps/web/src/app/(app)/layout.tsx`; concluir quando sessão encerrada limpar access token e a navegação lateral desktop tiver alternativa utilizável em tablet/celular.
- [ ] T034 [US1] Implementar consulta e filtros BNCC em `apps/web/src/app/(app)/plans/new/page.tsx` e `apps/web/src/components/bncc/`; concluir quando permitir filtro combinado, seleção múltipla persistente durante a busca, estado sem resultados e seleção por teclado/leitor de tela.
- [ ] T035 [US1] Implementar formulário de geração em `apps/web/src/components/plans/generation-form.tsx`; concluir quando validar habilidade, instrução, duração inteira positiva e escolha digital, habilitar/desabilitar ação corretamente e enviar os campos do contrato REST.
- [ ] T036 [US1] Implementar estados de preparação, falha e retry em `apps/web/src/components/plans/generation-state.tsx`; concluir quando bloquear envio duplicado durante até 60 s, preservar formulário em falha e iniciar nova tentativa somente após ação explícita.
- [ ] T037 [US1] Implementar recebimento e abertura do rascunho em `apps/web/src/app/(app)/plans/[id]/page.tsx` e `apps/web/src/components/plans/ai-draft-badge.tsx`; concluir quando mostrar status RASCUNHO, selo de auxílio por IA e conteúdo editável após sucesso.
- [ ] T038 [US2] Implementar lista e estado vazio em `apps/web/src/app/(app)/plans/page.tsx` e `apps/web/src/components/plans/plan-list.tsx`; concluir quando mostrar somente resultados da API para a conta autenticada, incluir ação de criar plano e tratar lista vazia.
- [ ] T039 [US2] Implementar editor e preview Markdown em `apps/web/src/components/plans/plan-editor.tsx` e `apps/web/src/components/plans/markdown-preview.tsx`; concluir quando edição e pré-visualização preservarem texto, renderização sanitizar HTML e o salvamento ocorrer somente por ação explícita.
- [ ] T040 [US2] Implementar salvamento e conflito de versão em `apps/web/src/components/plans/plan-editor.tsx`; concluir quando sucesso atualizar estado/lista e resposta 409 exibir orientação para recarregar sem sobrescrever conteúdo atual.
- [ ] T041 [US1] Criar testes de componentes do formulário/estados em `apps/web/src/components/plans/*.test.tsx`; concluir quando cobrirem seleção múltipla, validação, preparação, bloqueio de duplicidade, falha com campos preservados e retry manual.
- [ ] T042 [US2] Criar testes do editor/lista em `apps/web/src/components/plans/plan-editor.test.tsx` e `apps/web/src/app/(app)/plans/page.test.tsx`; concluir quando cobrirem estado vazio, lista própria, preview sanitizado, salvar explícito e conflito obsoleto.
- [ ] T043 [US3] Criar testes de fluxo de autenticação web em `apps/web/src/app/login/page.test.tsx` e `apps/web/src/lib/api/auth.test.ts`; concluir quando visitante não acessar telas protegidas, refresh recuperar access token em memória e logout encerrar navegação autenticada.

## Fase D — Testes integrados, documentação e verificação final

**Objetivo**: consolidar evidências de aceite, reprodutibilidade, acessibilidade e segurança.

**Critério de conclusão**: todos os comandos do quickstart executam; testes de integração cruzam as duas contas; fluxo é validado nas três larguras; migrations/seed/docs correspondem ao comportamento e não há credenciais versionadas.

- [ ] T044 [P] Criar teste ponta a ponta do fluxo principal em `apps/web/tests/e2e/generation-flow.spec.ts`; concluir quando login → busca → seleção múltipla → geração mock → rascunho → edição → preview → salvar → lista for exercitado com sucesso.
- [ ] T045 [P] Criar teste de privacidade ponta a ponta em `apps/web/tests/e2e/privacy.spec.ts`; concluir quando duas contas demonstrarem que leitura e edição cruzadas não revelam conteúdo e retornam estado de não encontrado.
- [ ] T046 Criar verificação automatizada de responsividade e acessibilidade em `apps/web/tests/e2e/responsive-accessibility.spec.ts`; concluir quando fluxos essenciais forem navegáveis por teclado e sem rolagem horizontal em desktop, tablet e celular, com foco visível e contraste AA aferido nos controles críticos.
- [ ] T047 Atualizar documentação de execução em `README.md` e `specs/001-bncc-planner/quickstart.md`; concluir quando pré-requisitos, instalação, Compose, migrations, seed, contas locais via ambiente, modos n8n e comandos reais coincidirem com a implementação.
- [ ] T048 Documentar configuração de ambiente e segurança em `.env.example`, `apps/api/.env.example`, `apps/web/.env.example` e `docs/security.md`; concluir quando nomes/portas/flags estiverem claros, nenhum valor secreto real aparecer e ajuste `Secure` localhost/produção estiver explícito.
- [ ] T049 Resolver a lacuna de catálogo em `docs/data/bncc-recorte.json`, `specs/001-bncc-planner/spec.md` e `apps/api/prisma/seed.ts`; concluir quando houver pelo menos oito registros autorizados distribuídos para os filtros ou FR-005 tiver alteração aprovada, com seed idempotente atualizado.
- [ ] T050 Executar e registrar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration` e `pnpm build` em `specs/001-bncc-planner/verification.md`; concluir quando todos finalizarem sem erro ou cada bloqueio estiver descrito com evidência e responsável por ação seguinte.
- [ ] T051 Revisar requisitos, constituição e segredos em `specs/001-bncc-planner/verification.md`; concluir quando FR-001–FR-018 e SC-001–SC-006 tiverem evidência referenciada, oito princípios constitucionais passarem e busca por arquivos `.env`/credenciais versionados não encontrar segredos.

## Dependências e ordem de execução

```text
Fase A: T001 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017/T018
Fase B: depende de T001–T016; T019 → T020 → T021/T022 → T023 → T024 → T025/T026 → T027 → T028–T030
Fase C: depende dos contratos REST da Fase B; T031 → T032/T033 → T034 → T035 → T036 → T037; T038/T039/T040 seguem editor/listagem; T041–T043 cobrem UI
Fase D: depende dos critérios correspondentes de A–C; T044/T045 em paralelo, depois T046–T051 (T049 precisa da decisão de catálogo)
```

### Oportunidades de paralelismo

- Fase A: T002–T005 podem ser desenvolvidas em paralelo depois da estrutura inicial; testes de auth e catálogo (T017/T018) são independentes quando os módulos existirem.
- Fase B: schema de validação, payload e mock (T019/T020/T022) podem ser trabalhados em arquivos distintos; integração só começa após o adapter e a transação.
- Fase C: tokens/componentes base (T031), login (T032) e layout (T033) podem avançar por arquivos separados; testes de editor e fluxo auth não dependem um do outro.
- Fase D: testes ponta a ponta de geração e privacidade (T044/T045) são independentes depois dos fluxos implementados.

## Estratégia de implementação

1. Completar a Fase A para obter um sistema executável, autenticado e com catálogo.
2. Completar a Fase B e validar o MVP da US1: geração válida ou falha sem plano parcial.
3. Completar a Fase C para a experiência de geração e a US2 de revisão/consulta; US3 é verificada também nos limites da API.
4. Completar a Fase D, incluindo resolução explícita do catálogo de cinco para oito itens antes de declarar aceite integral.

## Validação do formato

Todas as tarefas seguem `- [ ] Tnnn [P opcional] [US opcional] ação + caminho de arquivo + critério verificável`. Tarefas A são infraestrutura/base; B e C incluem rótulos de história; D trata verificação transversal.
