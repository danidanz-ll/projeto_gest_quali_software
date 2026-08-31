# TodoLab — template da turma

Aplicação TodoMVC deliberadamente incompleta usada no laboratório de Gestão e Qualidade de Software. A equipe é responsável por especificar, revisar, verificar e aprovar cada mudança; a IA atua apenas como fábrica terceirizada.

## Começo rápido

Requisito: Node.js 20 ou superior. Não há dependências externas nem etapa de instalação.

```bash
npm run dev
```

Abra `http://localhost:4173`. Para executar o quality gate local:

```bash
npm run check
```

O mesmo gate (`lint` + `build`) é executado pelo GitHub Actions em cada `push` e pull request.

## O que já funciona

- adicionar uma tarefa;
- listar tarefas;
- marcar e desmarcar como concluída;
- remover uma tarefa;
- persistir dados no navegador.

## O que ainda será construído

- contador de tarefas restantes;
- filtros;
- edição;
- seleção e limpeza em massa;
- acessibilidade aprofundada;
- testes automatizados e novos portões de qualidade.

## Fluxo obrigatório

1. Abra uma Issue e escreva critérios verificáveis.
2. Crie uma branch pequena e relacionada à Issue.
3. Registre o diálogo com a fábrica em `docs/prompts/ISSUE-NN.md`.
4. Execute `npm run check` e confira o diff.
5. Abra um pull request com `Closes #NN`.
6. Aguarde o CI e uma revisão substantiva de outra pessoa.
7. Faça merge somente com evidência suficiente.

> A equipe assina o que faz merge. “A IA escreveu” não é justificativa técnica.
