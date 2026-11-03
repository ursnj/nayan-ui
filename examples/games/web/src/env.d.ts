// The shared games read Expo's public env (defined by vite.config.ts) and Metro's dev flag.
declare const process: { env: Record<string, string | undefined> };
declare const __DEV__: boolean;
