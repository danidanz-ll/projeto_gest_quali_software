### Item do Backlog

Outro (especificado na descrição)

### História de Usuário (Necessidade de Negócio)

Como utilizador da lista de tarefas ,
Quero ver um contador dinâmico  com número de tarefas pendentes,
Para que saiba exatamente quantas tarefas ainda me faltam fazer e eu consiga acompanhar a minha jornada.

### Critérios de Aceite (BDD — Dado / Quando / Então)

- Cenário 1 (Múltiplas tarefas pendentes)
Dado que tenho 2 ou mais tarefas pendentes,
Quando visualizo o painel,
Então o contador deve formatar o texto no plural (ex: "2 itens restantes).

- Cenário 2 (Nenhuma tarefa pendente
Dado que não tenho nenhuma tarefa pendente na lista (lista vazia),
Quando visualizo o painel,
Então o contador deve exibir o texto "0 itens restantes".

### Fora do Escopo

Edição de conteúdo
Validação de entrada de dados
Filtros avançados
Ações em massa e eliminação

### Portão de Entrada — Checklist da DoR (Definition of Ready)

- [x] Os critérios estão em formato BDD (Dado / Quando / Então) verificável sem ambiguidade.
- [x] Os casos de borda e entradas inválidas foram contemplados.
- [x] A demanda foi apresentada e validada pelo professor em sala.