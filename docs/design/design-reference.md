Arquivo Figma: https://www.figma.com/design/4x1u2oDNI9poM2VzJuK4tP/planejador-bncc?node-id=0-1&m=dev


Design System - Planejador BNCC: https://www.figma.com/design/4x1u2oDNI9poM2VzJuK4tP/planejador-bncc?node-id=2-11440&m=dev

Login — Credenciais inválidas: https://www.figma.com/design/4x1u2oDNI9poM2VzJuK4tP/planejador-bncc?node-id=2-11755&m=dev

Meus planos — Rascunhos: https://www.figma.com/design/4x1u2oDNI9poM2VzJuK4tP/planejador-bncc?node-id=2-11830&m=dev

Meus planos — Estado vazio: https://www.figma.com/design/4x1u2oDNI9poM2VzJuK4tP/planejador-bncc?node-id=2-11932&m=dev

Novo plano — Formulário com validações: https://www.figma.com/design/4x1u2oDNI9poM2VzJuK4tP/planejador-bncc?node-id=2-11990&m=dev


Novo plano — Preparando rascunho: https://www.figma.com/design/4x1u2oDNI9poM2VzJuK4tP/planejador-bncc?node-id=2-12155&m=dev

Novo plano — Falha de geração: https://www.figma.com/design/4x1u2oDNI9poM2VzJuK4tP/planejador-bncc?node-id=2-12329&m=dev

Rascunho gerado — Editor e pré-visualização: https://www.figma.com/design/4x1u2oDNI9poM2VzJuK4tP/planejador-bncc?node-id=2-12495&m=dev


Rascunho — Confirmação de saída: https://www.figma.com/design/4x1u2oDNI9poM2VzJuK4tP/planejador-bncc?node-id=2-12608&m=dev

Referência: Design System e telas do Planejador BNCC

## Consulta MCP — 2026-10-02

### Fonte e capturas

- Arquivo consultado: `4x1u2oDNI9poM2VzJuK4tP`, conforme os links aprovados acima.
- O valor `fwD6CCqR2mNbQIaALPA7IL` listado como "File key" não corresponde aos links aprovados;
  não foi usado como cópia autorizada.
- O MCP retornou captura e contexto para os nove frames aprovados: Design System, login com
  credenciais inválidas, lista de rascunhos, estado vazio, formulário com validações, preparação,
  falha de geração, editor/pré-visualização e confirmação de saída.
- Como o conector ofereceu capturas, nenhuma exportação local em `docs/design/` foi necessária.

### Componentes confirmados

- Estrutura de aplicação com navegação lateral, barra superior de conta e ação de logout.
- Login com campos de e-mail e senha, validações em linha, alerta de credenciais inválidas e duas
  contas de demonstração visíveis.
- Lista pesquisável de rascunhos, tabela de planos, estado vazio e ação para criar plano.
- Catálogo BNCC em modo somente leitura, busca textual, selects de nível/ano/eixo, seleção múltipla
  por checkbox, chips de habilidades e limpeza de filtros.
- Campos de título, instrução pedagógica e duração; opções de recursos digitais; botões primário,
  secundário, com foco, desabilitado e destrutivo.
- Badges de `RASCUNHO` e `Auxílio por IA`, alertas de informação/sucesso/atenção/erro, carregamento
  com progresso, toast de sucesso e modal de confirmação de saída.
- Editor Markdown, barra de formatação, aba de pré-visualização, habilidade vinculada e ação
  explícita para salvar alterações.

### Tokens confirmados

| Categoria | Valores observados |
|---|---|
| Tipografia | Inter; 38 px para título de destaque, 30 px para título de página, 22 px para seção, 15 px para corpo e 12 px para metadados. |
| Espaçamento | Escala de 4, 8, 12, 16, 24, 32 e 48 px. |
| Raios | 4, 8, 12 e 16 px; `999px` para chips, badges e controles circulares. |
| Elevação | Card com elevação baixa; modal e toast com elevação alta. |
| Cores nomeadas | Azul 900 `#173A63`, Azul 700 `#245F9E`, Azul 100 `#DCEBFA`, superfície `#FFFFFF`, texto `#172333`, sucesso `#247A55`, atenção `#A45B12` e erro `#B43A3A`. |
| Cores de apoio | Texto secundário `#58677A`, borda `#D8E0EA`, azul auxiliar `#2F73B8`, superfície azul-clara `#F1F7FD`, borda forte `#AEBBCB`, informação `#EAF3FC`/`#2566A8` e fundo de erro `#FDECEC`. |

### Estados confirmados

- Login inválido: alerta e mensagens específicas nos campos de e-mail e senha.
- Formulário inválido: duração igual a zero, mensagem de correção e geração desabilitada.
- Formulário válido/selecionado: habilidades marcadas, duração válida e opção digital escolhida.
- Preparação: mensagem de IA, barra de progresso, bloqueio de novo envio e indicação de até
  60 segundos.
- Falha de geração: alerta de erro, campos e habilidades preservados e ação manual para tentar
  novamente.
- Rascunho: estado `RASCUNHO`, selo de auxílio por IA, alterações salvas, alterações não salvas e
  confirmação antes de sair sem salvar.
- Coleções: lista com rascunhos e estado vazio sem rascunhos.

### Adaptação responsiva

Os nove frames consultados mostram apenas o layout de desktop. A aplicação usa colunas, cards,
navegação lateral e tabelas que precisarão de regras para tablet e celular, mas não há frames ou
variantes aprovadas que permitam confirmar essas regras. Não foram inferidos breakpoints,
empilhamento, navegação móvel ou comportamento da tabela.

### Comparação com a specification

**Alinhamentos confirmados**

- FR-001, FR-002 e FR-004: duas contas de demonstração, ausência de cadastro público e logout são
  representados na interface.
- FR-005 a FR-009: catálogo somente leitura, filtros, seleção múltipla, validação de duração e
  estado de preparação são representados.
- FR-010 e FR-013: a preparação informa limite de 60 segundos; a falha preserva os dados e a nova
  tentativa é uma ação explícita.
- FR-013 a FR-017: editor, pré-visualização, salvamento explícito, rascunhos privados, status
  `RASCUNHO` e identificação de auxílio por IA são representados.

**Lacunas ou conflitos confirmados**

- A tela de novo plano afirma que "nada é salvo automaticamente", enquanto FR-012 exige salvar um
  rascunho válido assim que a geração termina. A regra de produto precisa ser reconciliada antes do
  planejamento.
- Não há tela para expiração de sessão após 8 horas, acesso negado a rascunho de outro professor ou
  sessão expirada; portanto FR-003 e FR-016 não possuem cobertura visual completa.
- Não há estado visual para bloqueio de salvamento desatualizado e recarregamento do rascunho;
  FR-014 não possui cobertura visual completa.
- A minimização de dados enviada à IA (FR-011) é comportamento de integração e não pode ser
  confirmada por frames de interface.
- FR-018 e SC-005 exigem desktop, tablet e celular; somente desktop foi fornecido nos frames
  aprovados.
