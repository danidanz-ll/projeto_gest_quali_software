# FOCUS-06 — Comemoração ao concluir tarefa

## 1. Identificação da funcionalidade

- **Identificador:** FOCUS-06
- **Título:** Tela de comemoração ao concluir tarefa
- **Issue de referência:** [#38 — FOCUS-06 — Tela de comemoração ao concluir tarefa](https://github.com/danidanz-ll/projeto_gest_quali_software/issues/38)
- **Produto:** FocusTodo / TodoLab
- **Tipo:** feedback visual após conclusão bem-sucedida de tarefa associada a uma sessão de foco
- **Dependência funcional:** conclusão explícita de tarefa introduzida pelo FOCUS-05

## 2. Pedido do cliente

Como usuário, quero receber um feedback visual positivo ao concluir uma tarefa, para que minhas conquistas sejam reconhecidas e a experiência de utilização do FocusTodo seja mais agradável e motivadora.

## 3. Contexto

Com o FOCUS-05, o usuário pode concluir uma tarefa vinculada ao Pomodoro durante uma sessão de foco ou depois que o cronômetro chega a zero. A conclusão já possui confirmação e atualização de estado, mas não oferece uma experiência visual específica de reconhecimento.

O FOCUS-06 acrescenta uma tela breve de comemoração, integrada ao visual do TodoLab. Ela deve destacar a tarefa concluída e oferecer uma forma clara de continuar usando a aplicação, sem alterar a conclusão da tarefa nem as regras dos ciclos Pomodoro.

Há dois fluxos temporais a preservar:

1. **Conclusão antecipada:** o foco ainda está em execução quando a tarefa é concluída. Ao sair da comemoração, o usuário continua na mesma sessão; o tempo transcorrido durante a tela de comemoração também deve ser contabilizado.
2. **Conclusão após o Pomodoro:** o foco já chegou ao fim quando a tarefa é concluída. A comemoração é apresentada antes do retorno à sessão concluída. Ao sair dela, a próxima etapa continua disponível para início manual.

A comemoração só é pertinente quando a atualização da tarefa tiver sido confirmada com sucesso. Uma confirmação cancelada ou uma falha na atualização não deve produzir feedback de sucesso.

## 4. Critérios de aceite — BDD

### Cenário 1 — Exibir comemoração após concluir tarefa

**Dado** que o usuário solicitou e confirmou a conclusão de uma tarefa  
**Quando** o TodoLab confirmar que a atualização da tarefa foi bem-sucedida  
**Então** o FocusTodo deve apresentar a tela de comemoração, destacando a conclusão.

### Cenário 2 — Identificar a tarefa e reconhecer a conquista

**Dado** que uma tarefa foi concluída com sucesso  
**Quando** a tela de comemoração for apresentada  
**Então** ela deve exibir o nome da tarefa concluída e uma mensagem positiva de reconhecimento.

### Cenário 3 — Comemorar uma conclusão antecipada

**Dado** que o Pomodoro de foco ainda está em execução  
**Quando** o usuário confirmar a conclusão da tarefa associada e o TodoLab atualizar a tarefa com sucesso  
**Então** a comemoração deve ser exibida sem descartar nem reiniciar o estado original da sessão.

### Cenário 4 — Retornar ao foco em andamento considerando o tempo transcorrido

**Dado** que a tarefa foi concluída durante um Pomodoro em execução  
**E** que a tela de comemoração permaneceu aberta por um intervalo de tempo  
**Quando** o usuário selecionar a opção para continuar  
**Então** a aplicação deve retornar à mesma sessão, mantê-la em execução e apresentar o tempo restante considerando também o intervalo transcorrido durante a comemoração.

### Cenário 5 — Comemorar após o término do Pomodoro

**Dado** que a sessão de foco já chegou a zero e está concluída  
**Quando** o usuário confirmar a conclusão da tarefa associada e a atualização for bem-sucedida  
**Então** a comemoração deve ser apresentada antes de o usuário retornar ao fluxo de progressão dos ciclos de foco e descanso.

### Cenário 6 — Retornar à sessão concluída

**Dado** que a tarefa foi concluída depois de o Pomodoro chegar a zero  
**E** que a tela de comemoração está sendo apresentada  
**Quando** o usuário sair da comemoração  
**Então** a sessão deve permanecer no estado `completed`  
**E** a opção de iniciar manualmente a próxima etapa deve continuar disponível.

### Cenário 7 — Não comemorar quando a conclusão falhar

**Dado** que o usuário solicitou a conclusão de uma tarefa  
**Quando** a atualização do estado da tarefa falhar  
**Então** a comemoração não deve ser apresentada  
**E** a aplicação deve manter o fluxo de erro definido no FOCUS-05.

### Cenário 8 — Evitar exibição duplicada

**Dado** que a comemoração já foi apresentada para uma conclusão confirmada  
**Quando** ocorrer uma nova renderização, recuperação da aplicação ou atualização da interface  
**Então** a mesma conclusão não deve apresentar a comemoração novamente sem uma nova conclusão confirmada.

### Cenário 9 — Encerrar a comemoração com teclado ou controle visual

**Dado** que a tela de comemoração está aberta  
**Quando** o usuário utilizar os controles de teclado ou selecionar a opção para continuar  
**Então** deve ser possível fechar a tela e retornar ao fluxo correto  
**E** as informações e o estado da sessão Pomodoro devem ser preservados.

## 5. Direcionamentos de implementação

### 5.1 Organização e arquitetura

- Manter a comemoração como componente visual isolado, sem transferir para ela as regras de negócio do `TodoStore` ou do Pomodoro.
- Integrar a apresentação aos módulos e eventos já utilizados pela aplicação.
- Reutilizar os padrões visuais existentes no TodoLab.
- Preservar integralmente o comportamento dos FOCUS-01 a FOCUS-05, em especial o fluxo existente de confirmação e conclusão explícita da tarefa.
- A implementação atual mantém a estrutura visual em `index.html`, os estilos em `src/styles.css` e o comportamento encapsulado em `src/task-celebration.js`; `src/app.js` coordena a exibição após o resultado da conclusão.

### 5.2 Componente visual da comemoração

A tela deve:

- Apresentar o nome da tarefa concluída.
- Exibir uma mensagem positiva de reconhecimento.
- Incluir um elemento visual de celebração.
- Oferecer uma ação clara para continuar usando a aplicação.
- Ser breve e integrada ao visual existente.
- Utilizar animação leve, preferencialmente com CSS, sem efeitos excessivos ou prolongados.

Na implementação atual, o componente usa uma camada de diálogo acessível e uma animação CSS curta. A preferência do sistema por movimento reduzido desativa a animação.

### 5.3 Integração com a conclusão de tarefas

- Reutilizar a conclusão já implementada no FOCUS-05; não criar uma segunda lógica de atualização da tarefa.
- Exibir a comemoração somente quando a operação retornar confirmação de conclusão bem-sucedida.
- Manter o feedback de erro existente quando a tarefa não puder ser salva.
- Não apresentar a comemoração se a confirmação do usuário for cancelada ou se a tarefa não tiver sido atualizada com sucesso.

Na aplicação atual, `src/app.js` chama `celebration.show(...)` somente após o resultado `completed` do `TodoStore.concluir`. Resultados de falha, tarefa inexistente ou tarefa já concluída não iniciam a comemoração.

### 5.4 Comportamento durante sessões Pomodoro em andamento

- Apresentar a comemoração sem pausar, reiniciar ou substituir a sessão em execução.
- Ao continuar, retornar à mesma sessão com o timer ainda em execução.
- O cronômetro deve considerar o tempo de parede transcorrido durante a comemoração; não se deve congelar o contador nem acrescentar artificialmente o intervalo ao tempo restante.
- A atualização da interface após o fechamento deve refletir o estado e o tempo corretos da sessão.

### 5.5 Comportamento após o término do Pomodoro

- Se o foco já estiver concluído, apresentar primeiro a comemoração da tarefa.
- Fechar a comemoração não deve iniciar automaticamente a próxima etapa.
- Após o fechamento, manter a sessão em `completed` e a ação para iniciar manualmente a próxima etapa disponível.

### 5.6 Preservação do tempo e do estado da sessão

- Usar a referência temporal real já mantida pelo Pomodoro para calcular o tempo restante.
- Não redefinir `endsAt`, o tempo restante, o tipo da sessão, a tarefa associada ou o contador de focos concluídos por causa da comemoração.
- A atualização visual ao fechar a tela deve consultar o estado atual do timer, em vez de restaurar uma cópia temporal desatualizada.
- A comemoração não modifica a progressão de foco e descanso nem as durações configuradas.

### 5.7 Tratamento de falhas de persistência

- A comemoração depende do sucesso da atualização da tarefa, não apenas da confirmação do usuário.
- Se a persistência falhar, manter o fluxo de erro do FOCUS-05, não comunicar sucesso e não exibir a comemoração.
- A falha não deve provocar reinicialização ou alteração indevida do cronômetro.

### 5.8 Prevenção de exibição duplicada

- A apresentação deve estar vinculada ao resultado bem-sucedido de uma nova conclusão, não à renderização comum da interface.
- Re-renderizações e recuperação do estado persistido não devem reproduzir a comemoração de uma conclusão anterior.
- Uma tela que já esteja aberta não deve ser aberta novamente por outra chamada de apresentação.
- Fechar a tela não deve disparar de novo a conclusão da tarefa, avançar o ciclo ou alterar a contagem de sessões.

### 5.9 Acessibilidade

- A tela deve ser identificável como diálogo, ter nome e descrição acessíveis e oferecer um controle de continuação operável por teclado.
- O foco deve ser direcionado para a ação de continuação ao abrir a comemoração e devolvido ao fluxo da aplicação ao fechá-la.
- A navegação por `Tab` deve permanecer dentro do diálogo enquanto ele estiver aberto.
- `Escape` deve permitir encerrar a tela, preservando o estado do Pomodoro.
- A animação deve respeitar a preferência por movimento reduzido.

Esses comportamentos correspondem ao diálogo `#task-celebration` e à classe `TaskCelebration` em `src/task-celebration.js`.

### 5.10 Testabilidade e qualidade

- Criar testes automatizados para os contextos de sessão em andamento e sessão concluída, incluindo o estado retornado ao fechar a comemoração.
- Verificar que o tempo transcorrido enquanto a tela está aberta é contabilizado e que a sessão em execução não é congelada.
- Verificar que falhas de persistência e cancelamento da confirmação não produzem comemoração.
- Verificar a prevenção de exibição duplicada e os controles de teclado.
- Executar os testes e as verificações de qualidade descritos na seção 7 antes de considerar a funcionalidade validada.

Os testes de integração da aplicação estão em `tests/app-focus.test.js` e cobrem a apresentação após sucesso, falha de persistência, retorno com o timer em andamento, retorno após conclusão e interação por teclado.

## 6. Fora do escopo

- Sistema de níveis, XP ou pontuação.
- Moedas, recompensas virtuais ou desbloqueio de itens.
- Ranking ou competição entre usuários.
- Personalização de animações.
- Animações complexas.
- Sons de conquista.
- Notificações do sistema operacional.
- Histórico de sessões.
- Painel de estatísticas.
- Alteração nas regras de negócio de conclusão de tarefas.
- Alteração nas durações ou na progressão dos ciclos Pomodoro.

## 7. Como verificar

### 7.1 Verificação manual

1. Associe uma tarefa pendente a uma sessão de foco, inicie o Pomodoro e solicite a conclusão da tarefa.
2. Confirme a conclusão e verifique que a comemoração aparece somente após o sucesso, apresenta o nome da tarefa e uma mensagem positiva.
3. Mantenha a comemoração aberta durante alguns segundos. Ao continuar, confirme que o Pomodoro segue em execução e que o tempo restante reflete o intervalo transcorrido.
4. Em outra sessão, aguarde o Pomodoro chegar a zero e conclua a tarefa associada. Confirme que a comemoração aparece antes do retorno à sessão concluída.
5. Feche a comemoração nesse segundo contexto e verifique que a sessão continua concluída e que a próxima etapa pode ser iniciada manualmente.
6. Simule uma falha de persistência da tarefa e confirme que a comemoração não aparece e que o feedback de erro permanece disponível.
7. Feche a comemoração e provoque renderizações ou recupere a aplicação; confirme que a mesma conclusão não a apresenta novamente.
8. Use `Tab`, `Shift+Tab`, `Escape` e o controle de continuação para verificar o acesso por teclado e o retorno correto ao fluxo.

### 7.2 Verificação automatizada

Na raiz do repositório, executar:

```text
npm test
npm run check
git diff --check
```

Os testes devem verificar a exibição condicionada ao sucesso, o nome da tarefa, a ausência de comemoração após falha, o tempo transcorrido durante a tela, o retorno aos estados `running` e `completed`, a progressão manual após o término e a interação por teclado. `npm run check` também executa lint e build.

## 8. Restrições técnicas

- Manter compatibilidade com a arquitetura de módulos ES e o modelo de eventos já utilizado pelo projeto.
- Implementar a apresentação como componente visual isolado, sem dependências externas para a comemoração.
- Preferir CSS para efeitos visuais e manter animações leves, curtas e compatíveis com movimento reduzido.
- Não alterar as regras de conclusão de tarefas nem as durações, transições ou progressão do Pomodoro.
- Preservar o tempo real da sessão durante a apresentação da comemoração.
- Não apresentar a tela como consequência de renderização, recuperação ou atualização de interface; a exibição depende de uma nova conclusão confirmada com sucesso.