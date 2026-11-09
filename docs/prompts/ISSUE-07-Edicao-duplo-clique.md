### Item do Backlog

Outro (especificado na descrição)

### História de Usuário (Necessidade de Negócio)

"Como Usuario do TodoLab, quero poder editar tarefas criadas com o duplo clique, para que possa corrigir as tarefas".

### Critérios de Aceite (BDD — Dado / Quando / Então)

**- Cenário 1** 
      Dado existe uma tarefa criada
      Quando o usuário clicar 2 vezes em cima dela
      Então o input será habilitado

**- Cenário 2**
     Dado que o usuario clicou 2 vezes em cima de uma tarefa
     Quando ele pressionar Enter ou clicar para fora da tarefa (blur)
     Então qualquer edição feita na tarefa será salva

**- Cenário 3**
      Dado que o usuario clicou 2 vezes em cima de uma tarefa 
      Quando ele pressionar ESC
      Então a edição será cancelada


### Fora do Escopo

- Criar tela de edição, a tela para edição deve ser a mesma de visualização, apenas o texto de input deve ser editável após os cliques, nenhuma tela secundária deve ser aberta para tal.

### Portão de Entrada — Checklist da DoR (Definition of Ready)

- [x] Os critérios estão em formato BDD (Dado / Quando / Então) verificável sem ambiguidade.
- [x] Os casos de borda e entradas inválidas foram contemplados.
- [x] A demanda foi apresentada e validada pelo professor em sala.