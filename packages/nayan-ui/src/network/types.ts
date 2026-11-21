/** null means the platform has not reported connectivity yet (or cannot determine it). */
export type OnlineState = boolean | null;
export type NetworkListener = (online: OnlineState) => void;

export interface NetworkWaitOptions {
  /** Deadline in milliseconds. Defaults to 30 seconds. */
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** An explicit application-owned health endpoint. No vendor endpoint is contacted. */
export interface ReachabilityOptions {
  url: string;
  method?: 'GET' | 'HEAD';
  timeout?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Default: a 2xx response. Use 204 for endpoints designed for captive portal detection. */
  expectedStatus?: number;
}
