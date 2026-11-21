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
  const worker = new Worker(new URL('./compiler.worker.ts', import.meta.url), { type: 'module' });
  const pending = new Map<number, { resolve: (output: unknown) => void; reject: (error: Error) => void }>();
  let sequence = 0;
  let failure: Error | undefined;

  function close(error: Error) {
    failure = error;
    worker.terminate();
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  }

  worker.onmessage = ({ data }: MessageEvent<CompilerResponse>) => {
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    if ('error' in data) request.reject(new Error(data.error));
    else request.resolve(data.output);
  };
  worker.onerror = () => close(new Error('The TypeScript compiler failed to load.'));

  function send<Command extends keyof Commands>(command: Command, input: Commands[Command]['input']): Promise<Commands[Command]['output']> {
    if (failure) return Promise.reject(failure);
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve: (output) => resolve(output as Commands[Command]['output']), reject });
      worker.postMessage({ id, command, ...input });
    });
  }

  return {
    compile: (code: string) => send('compile', { code }),
    check: (code: string) => send('check', { code }),
    complete: (code: string, position: number) => send('complete', { code, position }),
    dispose: () => close(new Error('The TypeScript compiler was closed.'))
  };
}
