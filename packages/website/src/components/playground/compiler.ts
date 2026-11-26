export type Completion = { label: string; text: string; start: number; end: number };

type Commands = {
  compile: { input: { code: string }; output: string };
  check: { input: { code: string }; output: string[] };
  complete: { input: { code: string; position: number }; output: Completion[] };
};

export type CompilerRequest = {
  [Command in keyof Commands]: { id: number; command: Command } & Commands[Command]['input'];
}[keyof Commands];

export type CompilerResponse = { id: number; output: Commands[keyof Commands]['output'] } | { id: number; error: string };

export function createCompiler() {
  const pending = new Map<number, { resolve: (output: unknown) => void; reject: (error: Error) => void }>();
  const loadError = new Error('The TypeScript compiler failed to load.');
  const closedError = new Error('The TypeScript compiler was closed.');
  let worker: Worker | undefined;
  let sequence = 0;
  let disposed = false;

  function close(error: Error) {
    worker?.terminate();
    worker = undefined;
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  }

  function startWorker() {
    const next = new Worker(new URL('./compiler.worker.ts', import.meta.url), { type: 'module' });
    next.onmessage = ({ data }: MessageEvent<CompilerResponse>) => {
      const request = pending.get(data.id);
      if (!request) return;
      pending.delete(data.id);
      if ('error' in data) request.reject(new Error(data.error));
      else request.resolve(data.output);
    };
    next.onerror = () => {
      if (worker === next) close(loadError);
    };
    return next;
  }

  function send<Command extends keyof Commands>(command: Command, input: Commands[Command]['input']): Promise<Commands[Command]['output']> {
    if (disposed) return Promise.reject(closedError);
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      (worker ??= startWorker()).postMessage({ id, command, ...input });
      pending.set(id, { resolve: (output) => resolve(output as Commands[Command]['output']), reject });
    });
  }

  return {
    compile: (code: string) =>
      send('compile', { code }).catch((error) => {
        if (error === loadError) return send('compile', { code });
        throw error;
      }),
    check: (code: string) => send('check', { code }),
    complete: (code: string, position: number) => send('complete', { code, position }),
    dispose: () => {
      disposed = true;
      close(closedError);
    }
  };
}
