const sessionLocks = new Map<string, Promise<void>>();

/**
 * Executa operações do mesmo save em sequência. Isso impede que dois cliques
 * carreguem o mesmo estado antigo e que a última resposta apague a primeira.
 */
export async function withSessionLock<T>(token: string, task: () => Promise<T>): Promise<T> {
  const previous = sessionLocks.get(token) ?? Promise.resolve();
  let releaseCurrent!: () => void;
  const current = new Promise<void>(resolve => {
    releaseCurrent = resolve;
  });
  const queue = previous.then(() => current);
  sessionLocks.set(token, queue);

  await previous;
  try {
    return await task();
  } finally {
    releaseCurrent();
    if (sessionLocks.get(token) === queue) {
      sessionLocks.delete(token);
    }
  }
}
