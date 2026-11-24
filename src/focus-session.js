export function limparTarefaInexistente(session, tarefas) {
  if (
    !session
    || session.taskId === null
    || session.taskId === undefined
    || ['running', 'paused', 'completed'].includes(session.status)
    || tarefas.some((tarefa) => tarefa.id === session.taskId)
  ) {
    return session;
  }

  return { ...session, taskId: null };
}
