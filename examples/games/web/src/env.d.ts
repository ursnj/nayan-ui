declare const process: { env: Record<string, string | undefined> };
declare const __DEV__: boolean;

// Vite rewrites shared Metro asset and engine imports before bundling.
declare function require(id: string): any;
// Optional native scheduler; browsers use the setTimeout fallback.
declare const setImmediate: ((callback: () => void) => unknown) | undefined;
