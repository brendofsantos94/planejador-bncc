# Quickstart e validação

## Pré-requisitos

- Node.js 22.23.x LTS, pnpm 12.x e Docker Desktop.
- Copiar `.env.example` para os arquivos locais e preencher somente valores de
  desenvolvimento; nunca commitar `.env`.
- Usar `N8N_MODE=mock` nos testes. Para integração, definir `N8N_MODE=http`,
  `N8N_WEBHOOK_URL` e `N8N_API_KEY` apenas na API.

## Base e seed

```text
pnpm install
docker compose up -d postgres
pnpm --filter api prisma:migrate
pnpm --filter api prisma:seed
```

O seed idempotente cria duas contas locais e carrega `docs/data/bncc-recorte.json`.
O arquivo tem cinco itens, enquanto FR-005 exige oito; resolver essa diferença
antes do aceite final, sem inventar registros.

## Executar

```text
pnpm dev
```

Web: `http://localhost:3000`; API: `http://localhost:3001`.

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
