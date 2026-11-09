### Item do Backlog

Outro (especificado na descrição)

### História de Usuário (Necessidade de Negócio)

Como usuário do TodoLab, quero poder excluir tarefas, para que eu possa corrigir eventuais enganos

### Critérios de Aceite (BDD — Dado / Quando / Então)

**- Cenário 1**
      Dado que exista uma tarefa
      Quando o usuário passar o mouse sobre ela 
      Então um botão de excluir aparecerá

**- Cenário 2**
     Dado que exista uma tarefa
     Quando o usuário clicar no botão de exclusão
     Então a tarefa será excluída definitivamente do array e do storage

**- Cenário 3**
     Dado que existam duas ou mais tarefas cadastradas
     Quando o usuário clicar no botão de excluir de uma das tarefas
     Então somente a tarefa selecionada será removida do array e do storage.

### Fora do Escopo

Não deve implementar botão de excluir tudo, apenas o botão de exclusão individual

Não deve criar caixa de confirmar exclusão

Não deve criar funcionalidade de "Desfazer Exclusão", uma vez excluido será limpo do storage e fim.

Não deve criar atalho de exclusão via teclado

### Portão de Entrada — Checklist da DoR (Definition of Ready)

- [x] Os critérios estão em formato BDD (Dado / Quando / Então) verificável sem ambiguidade.
- [x] Os casos de borda e entradas inválidas foram contemplados.
- [x] A demanda foi apresentada e validada pelo professor em sala.