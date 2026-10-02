# Quickstart e validação

## Pré-requisitos

- Node.js 22.23.x LTS, pnpm 12.x e Docker Desktop.
- Copiar `.env.example` para `.env` na raiz, `apps/api/.env.example` para
  `apps/api/.env` e `apps/web/.env.example` para `apps/web/.env.local`. O Compose
  usa o `.env` da raiz para interpolar as variáveis do PostgreSQL; a API carrega
  explicitamente `apps/api/.env`; o Next.js carrega `apps/web/.env.local`.
- Manter no `.env` da raiz somente `POSTGRES_DB`, `POSTGRES_USER`,
  `POSTGRES_PASSWORD` e `POSTGRES_PORT`. `DATABASE_URL` e configurações/credenciais
  de auth e n8n pertencem a `apps/api/.env`; URLs `NEXT_PUBLIC_*` pertencem ao web.
- Nenhuma chave deve receber prefixo `NEXT_PUBLIC_`. Configure `N8N_API_KEY`
  localmente pelo VS Code em `apps/api/.env`, sem salvá-la no repositório.
- `DATABASE_URL` deve usar o mesmo usuário, senha, banco e porta definidos no
  `.env` da raiz. Deixe `N8N_MODE=mock` durante esta fase.
- Usar `N8N_MODE=mock` durante a Fase A e nos testes. A chave deve ser configurada
  somente pela API, em `apps/api/.env`, no VS Code; a integração real só será
  habilitada na Fase B. `N8N_TIMEOUT_MS=90000` é referência ajustável, não garantia
  de duração: o timeout encerra a espera da API, mas pode não cancelar o workflow n8n.

## Base e seed

```text
pnpm install
docker compose up -d postgres
docker compose ps
pnpm --filter @planejador/api prisma:generate
pnpm --filter @planejador/api prisma:migrate
pnpm --filter @planejador/api prisma:seed
```

O seed idempotente cria duas contas locais e carrega `docs/data/bncc-recorte.json`.
O arquivo tem cinco itens, enquanto FR-005 exige oito; resolver essa diferença
antes do aceite final, sem inventar registros.

## Executar

```text
pnpm dev
```

Web: `http://localhost:3000`; API base: `http://localhost:3001/api/v1`.

## Qualidade

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

## Cenários obrigatórios

1. Login/logout das duas contas; sessão expirada remove acesso.
2. Filtros combinados de nível/ano/eixo/código/texto e seleção múltipla.
3. Mock de sucesso: preparação, payload n8n com uma habilidade por linha, Plan
   `RASCUNHO` e selo de auxílio por IA.
4. Mock inválido, erro HTTP e timeout: formulário preservado, `AiRun=FAILED`, sem
   plano parcial e retry somente por ação explícita.
5. Editar Markdown, pré-visualizar texto sanitizado, salvar e reencontrar na lista;
   versão antiga retorna `409`.
6. Trocar o ID do plano entre contas: sempre `404`, sem vazamento.
7. Verificar cookie HttpOnly (Secure em produção), CORS, CSRF/Origin e ausência de
   segredo no bundle web.
8. Validar desktop/tablet/celular sem rolagem horizontal, tokens do DS, foco visível
   e contraste AA nos controles essenciais.
