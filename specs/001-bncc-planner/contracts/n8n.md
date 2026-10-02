# n8n adapter contract

Corpo confirmado em `docs/contracts/n8n.md`; não adicionar campos:

```json
{"sessao":"email-usuario","habilidade":"EF01CO01 — descrição oficial\nEF01CO02 — outra descrição","instrucao":"Criar uma atividade introdutória em dupla.","duracao":50,"recursos_digitais":true}
```

Enviar `POST` para `N8N_WEBHOOK_URL` com `Content-Type: application/json`,
`X-API-Key: N8N_API_KEY` e `X-Request-Id: <uuid>`. URL/chave somente na API;
timeout padrão 60.000 ms e sem retry.

Resposta aceita:

```json
{"success":true,"sessao":"email-usuario","habilidade":"EF01CO01 — descrição oficial","answer":"# Plano de aula\n## Objetivos\n...\n## Atividades\n...\n## Avaliação\n...","format":"markdown"}
```

Validar `success === true`, `format === "markdown"`, ecos coerentes e `answer`
com título, objetivos, atividades e avaliação. Não-2xx, timeout ou schema inválido
viram falha interna sem vazar corpo/segredo. O mock local cobre sucesso, inválido,
erro HTTP e timeout sem chamar o workflow compartilhado.
