# DEM-06 — Alternância Global: Marcar/Desmarcar Todas

## Identificação da rodada

- Issue: [#12 — DEM-06](https://github.com/danidanz-ll/projeto_gest_quali_software/issues/12)
- Branch: `feature/issue-12-alternancia-global-independente`
- Autor da alteração: Copilot, com solicitação e validação do usuário
- Revisor previsto: a definir pela equipe
- Data: 2026-11-10

## Contexto aprovado

A demanda foi reaberta para que a alternância global não dependa da DEM-05. A ação deve atuar sobre todas as tarefas cadastradas no store, preservar os demais dados e persistir a mudança de estado.

Critérios considerados:

- Se existir ao menos uma tarefa pendente, concluir todas.
- Se todas estiverem concluídas, reabrir todas.
- Com a lista vazia, não falhar nem criar dados.
- Não excluir tarefas nem alterar a rota.
- Persistir os estados atualizados.

Arquivos alterados:

- `index.html`
- `package.json`
- `src/app.js`
- `src/store.js`
- `src/styles.css`
- `tests/alternancia-global.test.js`

## Solicitação recebida

O usuário confirmou que a equipe começaria a trabalhar na DEM-06 após discutir a necessidade de independência da DEM-05 e melhorias nos critérios.

## Implementação realizada

- Adicionado `TodoStore.alternarTodas()`, que opera no conjunto completo de tarefas do store e salva uma vez após a alteração.
- Adicionado botão para concluir/reabrir todas as tarefas; fica desativado quando não há tarefas.
- Corrigida a chave `test` duplicada no `package.json`; o comando agora usa `node --test`.
- Adicionados testes para lista mista, reabertura, lista vazia, preservação de dados e persistência ao recriar o store.

## Verificação

Resultado de `npm run check`:

```text
Lint aprovado: 5 arquivos JavaScript verificados.
Build aprovado: artefato gerado em dist/.
ℹ tests 10
ℹ pass 10
ℹ fail 0
```

Verificação manual no navegador:

- Criadas três tarefas de teste.
- Acionado “Concluir todas”: os três checkboxes ficaram marcados e o botão passou a “Reabrir todas”.
- Acionado “Reabrir todas”: os três checkboxes foram desmarcados e o botão voltou a “Concluir todas”.

## Pull Request e revisão

- Pull Request: pendente de publicação.
- Revisão por integrante diferente do autor: pendente.
- Resultado do CI remoto: pendente.
- Decisão de merge: pendente.

## Aprendizado da rodada

- A implementação opera no estado completo do `TodoStore`, sem depender da lista filtrada nem das rotas da DEM-05.
- A validação automatizada inclui recarga simulada do store; a validação manual foi feita no navegador local.
