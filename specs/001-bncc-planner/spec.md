# Feature Specification: Planejador BNCC

**Feature Branch**: `main`  
**Created**: 2026-10-01  
**Status**: Draft  
**Input**: User description: "Planejador BNCC para professores com login de demonstração,
seleção de habilidades, geração assistida por IA e rascunhos privados."

## Clarifications

### Session 2026-10-01

- Q: Após quanto tempo sem atividade a sessão do professor deve ser encerrada automaticamente? → A: 8 horas sem atividade.
- Q: Como o sistema deve agir se o mesmo professor editar o mesmo rascunho em dois dispositivos e ambos tentarem salvar? → A: Impedir o salvamento desatualizado e pedir recarregamento.
- Q: Quanto tempo a aplicação deve esperar pela geração antes de informar que ela falhou? → A: 60 segundos.
- Q: Quais seções mínimas um plano gerado precisa conter para ser considerado válido? → A: Título, objetivos, atividades e avaliação.
- Q: Quais dados podem ser enviados ao serviço de IA para gerar o plano? → A: Habilidades, instrução, duração e uso de recursos digitais.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gerar rascunho a partir de habilidades BNCC (Priority: P1)

Como professor autenticado, quero localizar e selecionar habilidades BNCC, informar o contexto
pedagógico e solicitar um plano para receber um rascunho editável que apoie meu planejamento.

**Why this priority**: Esta é a entrega central do produto: transformar uma seleção curricular e
uma orientação docente em um plano inicial, sem tratá-lo como resultado final.

**Independent Test**: Um professor de demonstração entra, encontra habilidades no catálogo,
seleciona uma ou mais, informa os dados obrigatórios, solicita a geração e recebe um rascunho
privado identificado como auxílio por IA.

**Acceptance Scenarios**:

1. **Given** um professor autenticado e o catálogo mínimo disponível, **When** pesquisa por
   nível, ano aplicável, eixo, código ou texto, **Then** visualiza somente habilidades que atendem
   aos filtros informados.
2. **Given** uma ou mais habilidades selecionadas, instrução pedagógica preenchida, duração válida
   e a indicação de recursos digitais, **When** confirma a solicitação, **Then** visualiza o estado
   de preparação antes do resultado.
3. **Given** uma resposta de geração válida, **When** ela é recebida, **Then** um plano privado em
   estado RASCUNHO é salvo, identificado como auxílio por IA e exibido em Markdown editável.
4. **Given** uma falha ou resposta inválida da geração, **When** o processamento termina, **Then**
   os campos preenchidos permanecem disponíveis, nenhum plano parcial é salvo e nenhuma nova
   tentativa começa sem ação do professor.

---

### User Story 2 - Revisar e administrar rascunhos próprios (Priority: P2)

Como professor autenticado, quero editar e pré-visualizar o conteúdo em Markdown, salvar minhas
alterações e consultar meus rascunhos para continuar o planejamento posteriormente.

**Why this priority**: O valor do rascunho depende da revisão humana, da possibilidade de edição e
da recuperação do trabalho do próprio professor.

**Independent Test**: Com um rascunho existente, o professor altera o Markdown, alterna para a
pré-visualização, salva e o encontra na lista de seus rascunhos com o conteúdo atualizado.

**Acceptance Scenarios**:

1. **Given** um rascunho próprio aberto, **When** o professor edita o Markdown e solicita salvar,
   **Then** as alterações são persistidas somente após essa ação explícita.
2. **Given** um rascunho próprio com conteúdo Markdown, **When** o professor abre a
   pré-visualização, **Then** vê a apresentação correspondente sem perder o texto editável.
3. **Given** um professor com rascunhos, **When** consulta sua lista, **Then** visualiza somente os
   seus rascunhos e pode abrir um deles.

---

### User Story 3 - Proteger acesso e encerrar sessão (Priority: P3)

Como professor, quero que minha sessão e meus rascunhos permaneçam privados, e quero sair da
aplicação quando terminar o uso.

**Why this priority**: A privacidade dos planos docentes é requisito de segurança e condição para
usar a aplicação com confiança.

**Independent Test**: Duas contas de demonstração entram separadamente; uma tenta abrir ou alterar
um rascunho da outra e é impedida. Cada uma consegue encerrar sua própria sessão.

**Acceptance Scenarios**:

1. **Given** um visitante sem sessão, **When** tenta abrir uma área protegida, **Then** é levado ao
   login e não visualiza dados de planos.
2. **Given** dois professores de demonstração com rascunhos distintos, **When** um deles tenta ler
   ou editar o rascunho do outro, **Then** o acesso é negado sem expor o conteúdo do rascunho.
3. **Given** um professor autenticado, **When** seleciona sair, **Then** a sessão é encerrada e as
   áreas protegidas deixam de estar acessíveis até novo login.

### Edge Cases

- Pesquisa sem resultados informa que nenhuma habilidade corresponde aos filtros e preserva os
  filtros aplicados.
- Solicitação sem habilidade, instrução pedagógica ou duração válida informa os campos a corrigir e
  não inicia a geração.
- Uma duração zero, negativa ou não numérica não pode ser confirmada.
- Uma resposta que não tenha título, objetivos, atividades e avaliação em Markdown é tratada como
  inválida, preserva a solicitação e não cria um rascunho.
- A geração que não produzir resposta válida em 60 segundos é tratada como falha, preserva a
  solicitação e permite nova tentativa somente por ação explícita do professor.
- Uma sessão encerrada ou expirada não permite ler, editar ou salvar rascunhos.
- Um salvamento baseado em conteúdo que mudou desde a abertura do rascunho é bloqueado e orienta o
  professor a recarregar o conteúdo atual antes de tentar novamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar login somente para contas de demonstração previamente
  cadastradas e MUST disponibilizar pelo menos duas contas distintas para testes de privacidade.
- **FR-002**: O sistema MUST NOT disponibilizar cadastro público, administração, publicação pública,
  finalização, versionamento de planos ou exportação em PDF neste escopo.
- **FR-003**: O sistema MUST criar uma sessão autenticada após credenciais válidas, MUST exigir essa
  sessão para qualquer área de planos ou catálogo e MUST encerrá-la após 8 horas sem atividade.
- **FR-004**: O sistema MUST permitir que o professor encerre sua sessão por uma ação explícita de
  logout.
- **FR-005**: O sistema MUST oferecer um catálogo mínimo de pelo menos oito habilidades BNCC, com
  informações de nível, ano quando aplicável, eixo, código e texto, distribuídas de modo a permitir
  testar os filtros.
- **FR-006**: O sistema MUST permitir pesquisar e combinar filtros por nível, ano quando aplicável,
  eixo, código e texto da habilidade.
- **FR-007**: O sistema MUST permitir selecionar uma ou mais habilidades dentre os resultados da
  pesquisa.
- **FR-008**: O sistema MUST exigir ao menos uma habilidade, uma instrução pedagógica não vazia,
  duração em minutos maior que zero e a indicação de uso de recursos digitais antes da solicitação.
- **FR-009**: O sistema MUST exibir um estado de preparação após a confirmação e antes de apresentar
  o resultado de geração.
- **FR-010**: O sistema MUST enviar a solicitação do professor ao serviço de IA e MUST aceitar o
  resultado somente quando contiver, em Markdown, título, objetivos, atividades e avaliação. O
  sistema MUST tratar como falha a ausência de resposta válida após 60 segundos.
- **FR-011**: O sistema MUST enviar ao serviço de IA somente as habilidades selecionadas, a
  instrução pedagógica, a duração e a indicação de recursos digitais. O sistema MUST NOT enviar a
  identidade do professor, dados de sessão ou conteúdo de outros rascunhos.
- **FR-012**: Para uma resposta válida, o sistema MUST salvar um plano pertencente somente ao
  professor solicitante, com estado RASCUNHO e indicação de auxílio por IA.
- **FR-013**: Para falha ou resposta inválida, o sistema MUST preservar os campos da solicitação,
  informar a falha, não salvar plano parcial e aguardar uma nova ação explícita antes de tentar
  novamente.
- **FR-014**: O sistema MUST permitir editar o Markdown de um rascunho próprio, pré-visualizar sua
  apresentação e persistir alterações somente após solicitação explícita de salvar. O sistema MUST
  bloquear um salvamento desatualizado quando o rascunho tiver mudado desde sua abertura e MUST
  solicitar o recarregamento do conteúdo atual.
- **FR-015**: O sistema MUST apresentar ao professor a lista de seus próprios rascunhos e permitir a
  abertura de cada item listado.
- **FR-016**: O sistema MUST autorizar cada leitura, edição e salvamento de plano pelo professor
  autenticado e MUST negar acesso a planos de outro professor sem revelar seu conteúdo.
- **FR-017**: O sistema MUST identificar claramente qualquer conteúdo originado por IA como auxílio
  por IA e tratá-lo como rascunho editável, sujeito à revisão do professor.
- **FR-018**: As telas MUST usar componentes e tokens coerentes com o Design System do Planejador
  BNCC e MUST permanecer utilizáveis em desktop, tablet e celular, com contraste compatível com
  WCAG AA nos elementos essenciais.

### Key Entities *(include if feature involves data)*

- **Professor**: Pessoa que usa uma conta de demonstração, possui uma sessão e é proprietária de seus
  rascunhos.
- **Habilidade BNCC**: Item curricular pesquisável, identificado por nível, ano quando aplicável,
  eixo, código e texto.
- **Solicitação de plano**: Conjunto temporário de habilidades selecionadas, instrução pedagógica,
  duração e indicação de recursos digitais, preservado quando a geração falha.
- **Plano**: Rascunho privado de um professor, com Markdown, estado RASCUNHO, indicação de auxílio
  por IA e dados da solicitação que o originou.
- **Sessão**: Estado que associa o uso autenticado a um professor e controla o acesso às áreas
  protegidas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um professor de demonstração consegue entrar, localizar habilidades, preencher a
  solicitação e iniciá-la em até 3 minutos, excluído o tempo de resposta da geração.
- **SC-002**: Em 100% dos testes com resposta válida, a solicitação cria exatamente um rascunho
  privado em estado RASCUNHO, identificado como auxílio por IA.
- **SC-003**: Em 100% dos testes de falha ou resposta inválida, nenhum rascunho parcial é criado e
  todos os dados informados na solicitação permanecem disponíveis para revisão ou nova tentativa.
- **SC-004**: Em 100% dos testes cruzados entre as duas contas de demonstração, um professor não
  consegue ler, editar ou salvar o rascunho pertencente ao outro.
- **SC-005**: Em avaliações nas larguras de desktop, tablet e celular, o fluxo de login, seleção de
  habilidades, geração e revisão é concluído sem perda de controles essenciais ou rolagem horizontal
  do conteúdo principal.
- **SC-006**: Em teste com um rascunho existente, o professor consegue editar, pré-visualizar, salvar
  e reencontrar o conteúdo atualizado em sua lista de rascunhos.

## Assumptions

- As duas contas de demonstração são entregues somente para uso local/de avaliação, sem cadastro
  público e sem recuperação de senha neste escopo.
- O catálogo mínimo contém ao menos oito habilidades representativas e não pretende cobrir toda a
  base BNCC nesta primeira entrega.
- A duração é um número inteiro de minutos maior que zero.
- Uma resposta de IA válida contém, em Markdown, título, objetivos, atividades e avaliação; a
  qualidade pedagógica do texto será avaliada pelo professor antes de qualquer uso.
- O estado RASCUNHO é o único estado de plano deste escopo.
- A aplicação apresenta mensagens claras para indisponibilidade do serviço de IA, sem tentativa
  automática adicional.
