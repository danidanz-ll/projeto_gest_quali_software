### Item do Backlog

B1 — Filtros por estado (todas / ativas / concluídas)

### História de Usuário (Necessidade de Negócio)

Como usuário do sistema TodoLab, quero poder filtrar a visualização da minha lista (Todas, Ativas, Concluídas), para que eu possa ver apenas as tarefas que ainda faltam fazer sem distrações.

### Critérios de Aceite (BDD — Dado / Quando / Então)

**Cenário 1 (Caminho Feliz - Filtro Ativo):** Dado que possuo tarefas mistas na lista, quando clico no filtro "Ativas" (rota #/active), então o sistema deve exibir apenas as tarefas pendentes, sem recarregar a página.   

**Cenário 2 (Caminho Feliz - Filtro Concluído):** Dado que possuo tarefas mistas na lista, quando clico no filtro "Concluídas" (rota #/completed), então o sistema deve exibir apenas as tarefas finalizadas, ocultando as pendentes.   

**Cenário 3 (Caminho Feliz - Filtro Todos):** Dado que visualizo uma lista filtrada, quando clico no filtro "Todas", então o sistema deve voltar a exibir a totalidade das tarefas registadas.

**Cenário 4 (Caso de Borda - Rota Inválida):** Dado que o utilizador altera manualmente a URL para um filtro inexistente (ex: #/pendencias), quando a rota é processada, então a aplicação deve aplicar a visualização padrão (Todas) e não quebrar a renderização da tela.   

### Fora do Escopo

1. Recarregar a página web: A alternância entre as visualizações (Todas, Ativas e Concluídas) deve ser feita apenas através da mudança de rotas na URL **(#/active, #/completed)** de forma pratica e dinâmica, sem recarregar a página.

2. Apagar ou modificar os dados salvos: O filtro atua apenas na visualização dos elementos na tela. Esta entrega não deve remover dados do **array** principal nem apagar informações do **localStorage**. A exclusão de tarefas pertence a outras demandas, como a exclusão individual na DEM-08 ou a limpeza em massa na DEM-03.   

3. Criar barras de pesquisa por texto: A funcionalidade de filtrar tarefas por palavras digitadas (busca por texto) não faz parte desta demanda. O escopo limita-se estritamente aos botões de status da tarefa (concluída ou pendente).

4. Alterar o status da tarefa: Clicar nos botões de filtro não deve marcar ou desmarcar as tarefas como concluídas. Essa ação de alternância de status global é responsabilidade da demanda DEM-06.

### Portão de Entrada — Checklist da DoR (Definition of Ready)

- [x] Os critérios estão em formato BDD (Dado / Quando / Então) verificável sem ambiguidade.
- [x] Os casos de borda e entradas inválidas foram contemplados.
- [x] A demanda foi apresentada e validada pelo professor em sala.