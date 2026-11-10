# ISSUE-09 — Reorganização de testes de domínio e remoção de responsabilidades da camada de store

## Identificação da rodada

- Issue: #09 — Reorganização de testes de domínio e remoção de responsabilidades da camada de store
- Branch (ramificação): feature/issue-09-higiene-arquitetura-store-testes
- Autor da alteração:
- Revisor previsto:
- Data:

## Contexto aprovado

- Link ou referência da Issue: feedback do professor sobre higiene arquitetural; `src/store.js` contém função de teste de limpeza de concluídas, o que mistura responsabilidade de domínio com responsabilidade de verificação.
- Critérios de aceite revisados pelo professor:
  - A função `executarTesteLimpezaDeConcluidas` deve ser removida de `src/store.js`.
  - A lógica de teste deve ser movida para a pasta `tests`.
  - A camada de persistência (`TodoStore`) deve manter apenas responsabilidade de negócio e armazenamento.
  - O comportamento funcional da aplicação não deve mudar.
- Arquivos que podem ser alterados:
  - `src/store.js`
  - `tests/**`
- Arquivos que não devem ser alterados:
  - `src/app.js`
  - `src/styles.css`
  - `index.html`
  - `package.json` (a menos que haja necessidade direta para execução dos testes)

## Prompt inicial enviado à IA

```text
Atue como equipe de desenvolvimento do TodoLab.

Contexto: Há um problema de higiene arquitetural no código atual: a função executarTesteLimpezaDeConcluidas está no arquivo src/store.js, misturando responsabilidades de domínio com testes. O objetivo é remover a lógica de verificação do módulo de dados e migrá-la para a pasta tests, sem alterar o comportamento da aplicação.
Critérios de aceite aprovados:
- Remover a função executarTesteLimpezaDeConcluidas de src/store.js.
- Mover a lógica de teste para um arquivo dentro da pasta tests.
- Mantém a API pública do store intacta, salvo necessidade justificada e compatível.
- Nenhuma funcionalidade de negócio deve ser alterada.

Restrições:
- JavaScript puro, sem novas dependências.
- Preserve as assinaturas existentes quando não houver justificativa para alterá-las.
- Altere somente os arquivos necessários.
- Explique quais arquivos foram modificados e como verificar manualmente.
```

## Resposta recebida da IA

```text
Cole aqui a resposta integral recebida.
```

## Verificação humana antes do Pull Request

- [ ] O diff foi lido pela equipe.
- [ ] Os critérios de aceite foram comparados com a alteração.
- [ ] `npm run check` foi executado e o resultado real foi registrado.
- [ ] A verificação manual no navegador foi realizada.
- [ ] Pendências, limitações ou dúvidas foram registradas abaixo.

Resultado real do `npm run check`:

```text
Cole aqui a saída relevante.
```

Verificação manual realizada:

- Passos:
- Resultado observado:
- Pendências ou riscos:

## Pull Request e revisão

- URL ou número do Pull Request:
- Autor do Pull Request:
- Revisor (integrante diferente do autor):
- O PR contém `Closes #09`? [ ] sim [ ] não
- Commit ou hash da versão revisada:
- Resultado do CI: [ ] verde [ ] vermelho [ ] ainda em execução
- Comentário substantivo do revisor (referencie um critério de aceite):
- Há mudanças solicitadas abertas? [ ] sim [ ] não
- A aprovação é da versão atual, depois das últimas correções? [ ] sim [ ] não [ ] não houve correção
- Aceite manual registrado, com cenários e resultado observado:
- Decisão: [ ] merge autorizado [ ] mudanças solicitadas [ ] pendente

O merge só é autorizado com CI verde, nenhuma mudança solicitada aberta, aceite manual registrado e aprovação da versão atual. Enquanto qualquer condição faltar, a decisão permanece pendente.

## Aprendizado da rodada

- Ambiguidade encontrada:
- Decisão tomada:
- Próxima melhoria de processo:
