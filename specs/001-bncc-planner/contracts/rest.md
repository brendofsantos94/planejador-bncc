# REST contract — API própria

Base local: `http://localhost:3001`; frontend usa somente esta API.

## Auth

- `POST /auth/login` — body `{email,password}`; `200` retorna `accessToken`,
  `expiresIn:900` e usuário, além de cookie refresh HttpOnly; `401` inválido;
  `422` formato inválido.
- `POST /auth/refresh` — refresh cookie + CSRF/Origin; rotaciona cookie e retorna
  novo access token; `401` expirado/revogado.
- `POST /auth/logout` — refresh cookie + CSRF/Origin; revoga e limpa cookie; `204`.

## Catálogo

`GET /bncc/skills` com bearer e query combinável `nivel`, `ano`, `eixo`, `codigo`,
`q`; `200` retorna `{items: Skill[]}`.

## Planos

`POST /plans/generations` com bearer cria `AiRun=PENDING` e executa n8n/mock:

```json
{"skillCodes":["EF01CO01","EF01CO02"],"instruction":"Criar uma atividade introdutória em dupla.","durationMinutes":50,"digitalResources":true}
```

`201` retorna `{requestId,plan}` após sucesso atômico; `422` entrada inválida;
`502` resposta externa inválida/não-2xx; `504` timeout 60 s. Em falha nenhum Plan
é criado e o formulário permanece no web.

`GET /plans` lista apenas o usuário. `GET /plans/:id` retorna detalhe ou `404`
para inexistente/alheio. `PATCH /plans/:id` recebe `{markdown,version}`, sanitiza
e valida; `200` incrementa versão, `409 STALE_VERSION` pede recarregamento,
`422` rejeita Markdown e `404` não revela plano alheio.

`PlanSummary`: `id`, `title`, `status`, `aiAssisted`, `version`, `updatedAt`.
`PlanDetail` inclui Markdown e habilidades vinculadas. Respostas de processamento
carregam `requestId` para correlação.
