# FOCUS-02 — Implementar ciclos de foco e descanso Pomodoro

## Pedido do cliente

Como usuário do TodoLab, quero alternar entre sessões de foco e pausas curtas ou longas seguindo a técnica Pomodoro, para organizar meus períodos de concentração e descanso durante a realização de atividades.

## Contexto

Atualmente, o TodoLab possui um cronômetro Pomodoro básico, implementado na FOCUS-01, que permite iniciar, pausar, retomar e reiniciar uma sessão de foco de 25 minutos.

Nesta evolução, queremos transformar o cronômetro em um ciclo Pomodoro, adicionando sessões de descanso e controle da quantidade de sessões de foco concluídas.

O funcionamento seguirá inicialmente o seguinte padrão:

- Foco: 25 minutos.
- Pausa curta: 5 minutos.
- Pausa longa: 15 minutos.
- A cada 4 sessões de foco concluídas, a próxima pausa deverá ser longa.

A próxima etapa não deve começar automaticamente. Após a conclusão de uma sessão, o usuário deverá iniciar manualmente a próxima etapa.

A implementação deve aproveitar a estrutura criada na FOCUS-01, evitando duplicação de lógica e preservando as funcionalidades já existentes.

## Critérios de aceite

### Cenário 1 — Identificação do tipo de sessão

Dado que o usuário acessou a aplicação  
Quando o cronômetro for exibido  
Então a interface deverá identificar claramente que a sessão atual é de foco, exibindo sua duração de 25 minutos.

### Cenário 2 — Conclusão de uma sessão de foco

Dado que uma sessão de foco está em execução  
Quando o cronômetro chegar a zero  
Então a sessão deverá ser marcada como concluída, o contador de sessões de foco deverá ser atualizado e a interface deverá indicar que uma pausa curta está disponível.

### Cenário 3 — Iniciar pausa curta

Dado que uma sessão de foco foi concluída e existe uma pausa curta disponível  
Quando o usuário selecionar a opção de iniciar a próxima etapa  
Então o cronômetro deverá iniciar uma sessão de pausa curta com duração de 5 minutos.

### Cenário 4 — Conclusão de pausa curta

Dado que uma pausa curta está em execução  
Quando o cronômetro chegar a zero  
Então a pausa deverá ser marcada como concluída e a interface deverá indicar que uma nova sessão de foco está disponível.

### Cenário 5 — Repetição do ciclo

Dado que uma pausa curta foi concluída  
Quando o usuário iniciar a próxima etapa  
Então o cronômetro deverá iniciar uma nova sessão de foco de 25 minutos, mantendo corretamente a contagem de sessões de foco concluídas.

### Cenário 6 — Disponibilização da pausa longa

Dado que o usuário concluiu quatro sessões de foco  
Quando a quarta sessão de foco for finalizada  
Então a próxima etapa disponível deverá ser uma pausa longa de 15 minutos, em vez de uma pausa curta.

### Cenário 7 — Conclusão de pausa longa

Dado que uma pausa longa está em execução  
Quando o cronômetro chegar a zero  
Então a pausa deverá ser marcada como concluída e a próxima etapa disponível deverá ser uma nova sessão de foco de 25 minutos.

### Cenário 8 — Reinicialização de uma sessão

Dado que existe uma sessão de foco ou descanso em execução ou pausada  
Quando o usuário selecionar reiniciar  
Então o cronômetro deverá retornar à duração original da etapa atual e permanecer parado, sem alterar indevidamente a contagem de sessões concluídas.

### Cenário 9 — Pausar e retomar diferentes etapas

Dado que o usuário está executando uma sessão de foco, pausa curta ou pausa longa  
Quando ele pausar e posteriormente retomar o cronômetro  
Então a contagem deverá continuar a partir do tempo restante, preservando o tipo e o estado da sessão.

### Cenário 10 — Persistência do ciclo

Dado que existe um ciclo Pomodoro em andamento ou uma próxima etapa disponível  
Quando o usuário atualizar a página  
Então a aplicação deverá recuperar o estado do ciclo, o tipo de sessão, o tempo restante e a quantidade de sessões de foco concluídas.

### Cenário 11 — Transição manual entre etapas

Dado que uma sessão foi finalizada  
Quando o cronômetro chegar a zero  
Então a próxima etapa deverá ser apenas disponibilizada na interface, sem iniciar automaticamente sua contagem.

### Cenário 12 — Contagem correta de sessões

Dado que uma sessão de foco foi iniciada, pausada ou reiniciada  
Quando ela ainda não tiver sido concluída  
Então ela não deverá ser contabilizada como uma sessão de foco concluída.

A contagem deverá ser incrementada somente uma vez quando uma sessão de foco chegar efetivamente ao término.

## Direcionamentos de implementação

### 1. Organização e arquitetura

A implementação deverá preservar a arquitetura modular definida na FOCUS-01.

Manter preferencialmente a seguinte divisão de responsabilidades:

- `src/pomodoro.js`: concentrar as regras de negócio do Pomodoro, incluindo os tipos de sessão, transições entre etapas, duração e contagem de ciclos.
- `src/focus-store.js`: persistir e recuperar o estado completo do ciclo, incluindo a sessão atual e a quantidade de sessões de foco concluídas.
- `src/app.js`: integrar as operações do Pomodoro aos controles da interface e atualizar os elementos visuais.
- `index.html` e `src/styles.css`: adicionar os elementos visuais necessários para identificar as etapas e disponibilizar a ação de iniciar a próxima sessão.
- `tests/`: adicionar testes automatizados para as novas regras e transições.

Não criar uma segunda implementação do cronômetro nem duplicar a lógica de controle de tempo já desenvolvida na FOCUS-01.

### 2. Tipos de sessão

A lógica deverá reconhecer três tipos de sessão:

- `focus`: sessão de foco, com duração de 25 minutos.
- `shortBreak`: pausa curta, com duração de 5 minutos.
- `longBreak`: pausa longa, com duração de 15 minutos.

As durações deverão ser definidas em um único local da lógica de negócio, evitando valores espalhados pelo código.

### 3. Controle do ciclo

A lógica deverá controlar a quantidade de sessões de foco efetivamente concluídas.

Regras:

- A primeira sessão deverá ser sempre de foco.
- Após uma sessão de foco concluída, disponibilizar uma pausa.
- Após cada uma das três primeiras sessões de foco do ciclo, disponibilizar uma pausa curta.
- Após a quarta sessão de foco concluída, disponibilizar uma pausa longa.
- Após a conclusão da pausa longa, reiniciar a sequência de ciclos, disponibilizando uma nova sessão de foco.
- Pausas concluídas não devem incrementar a contagem de sessões de foco.

A contagem deverá ser atualizada somente na conclusão efetiva de uma sessão de foco, nunca ao iniciar, pausar ou reiniciar.

### 4. Estados e transições

A implementação deverá preservar os estados definidos na FOCUS-01:

- `idle`: sessão parada.
- `running`: sessão em execução.
- `paused`: sessão pausada.
- `completed`: sessão finalizada.

Além disso, deverá identificar o tipo de sessão atual e a próxima etapa disponível.

Após a conclusão de uma etapa, a aplicação deverá aguardar uma ação explícita do usuário para iniciar a próxima.

A ação de iniciar a próxima etapa deverá configurar a duração correspondente ao novo tipo de sessão e iniciar sua contagem.

### 5. Precisão do cronômetro

Preservar a abordagem baseada em timestamps definida na FOCUS-01.

O cálculo do tempo restante não deverá depender de decrementos sucessivos de um segundo.

O `setInterval` poderá continuar sendo utilizado apenas para atualização visual da interface.

As regras de início, pausa, retomada, reinicialização e finalização deverão funcionar para os três tipos de sessão.

### 6. Persistência

A persistência deverá contemplar todas as informações necessárias para recuperar o ciclo Pomodoro, incluindo:

- Estado da sessão atual.
- Tipo de sessão atual.
- Duração da sessão.
- Tempo restante ou horário previsto para término.
- Quantidade de sessões de foco concluídas.
- Próxima etapa disponível, quando aplicável.

A recuperação deverá respeitar as regras de transição, evitando contabilizar uma sessão mais de uma vez após atualizações da página.

A estrutura de persistência existente deverá ser evoluída sem comprometer os dados e comportamentos da FOCUS-01.

### 7. Testabilidade e qualidade

As regras de negócio deverão permanecer independentes da interface.

Permitir o controle da fonte de tempo nos testes, sem aguardar os períodos reais de 25, 5 ou 15 minutos.

Adicionar testes automatizados contemplando:

- Conclusão de sessões de foco.
- Início e conclusão de pausas curtas.
- Disponibilização e conclusão de pausas longas.
- Contagem correta de sessões de foco.
- Reinicialização sem incremento indevido da contagem.
- Transições manuais entre etapas.
- Persistência e recuperação do ciclo.
- Prevenção de contabilização duplicada de sessões concluídas.

## Fora do escopo

- Personalização das durações de foco e descanso.
- Configuração da quantidade de sessões para liberar a pausa longa.
- Associação de sessões a tarefas específicas.
- Histórico detalhado de sessões.
- Dashboard e estatísticas de produtividade.
- Notificações do navegador e alertas sonoros.
- Início automático da próxima etapa.
- Cadastro de usuários, autenticação ou sincronização.
- Banco de dados externo.

## Como verificar

### Verificação manual

1. Abrir a aplicação e confirmar que a primeira etapa é uma sessão de foco de 25 minutos.
2. Iniciar e concluir uma sessão de foco utilizando uma duração reduzida em ambiente de teste.
3. Verificar se a próxima etapa disponível é uma pausa curta de 5 minutos.
4. Iniciar e concluir a pausa curta.
5. Confirmar que a próxima etapa disponível é uma nova sessão de foco.
6. Repetir o ciclo até concluir quatro sessões de foco.
7. Confirmar que, após a quarta sessão, a próxima etapa disponível é uma pausa longa de 15 minutos.
8. Concluir a pausa longa e confirmar que uma nova sessão de foco fica disponível.
9. Pausar e retomar sessões de diferentes tipos, verificando a preservação do tempo restante.
10. Reiniciar uma sessão e confirmar que a contagem de sessões concluídas não é alterada.
11. Atualizar a página durante uma sessão em execução ou pausada e verificar a recuperação correta do ciclo.
12. Confirmar que nenhuma próxima etapa começa automaticamente.

### Verificação automatizada

- Executar `npm test` e garantir que todos os testes existentes e novos sejam aprovados.
- Executar `npm run check` e garantir que lint, build e testes sejam aprovados.
- Testar todas as transições entre foco, pausa curta e pausa longa.
- Testar o contador de sessões concluídas.
- Testar a persistência e recuperação do ciclo.
- Utilizar relógio controlado nos testes, sem aguardar o tempo real das sessões.

### Restrições

- Utilizar JavaScript puro, sem adicionar dependências externas.
- Preservar as funcionalidades existentes do TodoLab.
- Reutilizar a arquitetura e a lógica implementadas na FOCUS-01.
- Não duplicar a implementação do cronômetro.
- Não misturar regras de negócio com manipulação do DOM.
- Não modificar desnecessariamente o `TodoStore`.
- Manter compatibilidade com os testes e funcionalidades existentes.