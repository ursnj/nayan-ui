export type NayanFeature =
  | 'games'
  | 'drawing'
  | 'components'
  | 'markdown'
  | 'storage'
  | 'uuid'
  | 'image-picker'
  | 'audio'
  | 'microphone'
  | 'haptics'
  | 'tts'
  | 'keep-awake'
  | 'review'
  | 'permissions'
  | 'sqlite'
  | 'video'
  | 'location';

interface RuntimeResolver {
  name: string;
  enforce: 'pre';
  resolveId(source: string): string | undefined;
}

export function nayanEngine(options: { features: readonly NayanFeature[] }): RuntimeResolver & {
  configResolved(config: { cacheDir: string }): void;
  config<WorkerPlugin = never>(config?: {
    worker?: { plugins?: () => WorkerPlugin[] };
  }): {
    optimizeDeps: { exclude: string[] };
    worker: { plugins(): (WorkerPlugin | RuntimeResolver)[] };
  };
};

export function resolveWasmRuntime(features: readonly NayanFeature[], options?: { cacheDirectory?: string }): string;
