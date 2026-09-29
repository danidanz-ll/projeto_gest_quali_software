### Item do Backlog

A2 — Impedir tarefas vazias ou com espaços

### História de Usuário (Necessidade de Negócio)

Como utilizador do TodoLab,
Quero que o sistema valide as tarefas introduzidas e bloquei submissões em branco ou compostas exclusivamente por espaços,
Para que a minha lista de tarefas permaneça organizada, limpa e sem itens invisíveis.

### Critérios de Aceite (BDD — Dado / Quando / Então)

- Cenário 1: Tentativa de submissão com campo vazio
Dado que o utilizador está no campo de criação de tarefas do TodoLab,
Quando deixa o campo de texto vazio e tentar submeter a tarefa, 
Então o sistema não deve deixar criar tarefa e a lista deve permanecer inalterada.

- Cenário 2: 
Dado que o utilizador digita apenas espaços ("       ") no campo, 
Quando tentar submeter a tarefa,
Então o sistema deve ignorar o pedido e impedir a criação de um item.

### Fora do Escopo

Prevenção de tarefas duplicadas
limpeza de dados legados
Edição de tarefas existentes 
Notificações em pop-up

### Portão de Entrada — Checklist da DoR (Definition of Ready)

- [x] Os critérios estão em formato BDD (Dado / Quando / Então) verificável sem ambiguidade.
- [x] Os casos de borda e entradas inválidas foram contemplados.
- [x] A demanda foi apresentada e validada pelo professor em sala.