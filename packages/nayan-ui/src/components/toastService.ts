import NativeEngine from '../native/NativeNayanEngine';
import { prepareEngine } from '../native/prepare';
import { toastSnapshot } from './toastSnapshot';

export interface NToastOptions {
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  /** Milliseconds; zero keeps the toast visible until dismissed. */
  duration?: number;
  actionLabel?: string;
  onActionPress?: () => void;
  /** Compact action syntax; legacy actionLabel/onActionPress remain supported. */
  action?: { label: string; onPress: () => void };
  /** Defaults to true. Persistent, non-dismissible messages can be closed programmatically. */
  dismissible?: boolean;
}
export type NToastOverrides = Omit<NToastOptions, 'message' | 'type'>;
export interface ToastState {
  toast: (Omit<NToastOptions, 'onActionPress' | 'action'> & { id: number }) | null;
  ids: number[];
  wakeAfter: number | null;
}
const actions = /* @__PURE__ */ new Map<number, () => void>();
let wake: ReturnType<typeof setTimeout> | undefined;
let serial = /* @__PURE__ */ Promise.resolve();

function command(request: Record<string, unknown>) {
  if (!NativeEngine) throw new Error('Toasts require the Nayan engine');
  const result = JSON.parse(NativeEngine.drawingCommand(0, JSON.stringify({ op: 'componentToast', ...request })));
  if (!result.ok) throw new Error(result.error);
  const snapshot = result.value as ToastState;
  for (const id of actions.keys()) if (!snapshot.ids.includes(id)) actions.delete(id);
  if (wake) clearTimeout(wake);
  // Rust supplies the deadline and promotes the queue. JS only transports the wake-up.
  wake = snapshot.wakeAfter === null ? undefined : setTimeout(() => enqueue({ action: 'snapshot' }), Math.max(1, snapshot.wakeAfter));
  toastSnapshot.publish(snapshot);
  return snapshot;
}
function enqueue(request: Record<string, unknown>, action?: () => void) {
  serial = serial
    .then(async () => {
      await prepareEngine();
      const state = command(request);
      if (action && request.action === 'show') actions.set(state.ids[state.ids.length - 1]!, action);
    })
    .catch((error) => console.error('NToast:', error));
}
function show(message: string | NToastOptions, options?: Omit<NToastOptions, 'message'>) {
  const { action, onActionPress, ...toast } = typeof message === 'string' ? { ...options, message } : message;
  enqueue({ action: 'show', toast: { ...toast, actionLabel: action?.label ?? toast.actionLabel } }, action?.onPress ?? onActionPress);
}
const status = (type: NonNullable<NToastOptions['type']>) => (message: string, options?: string | NToastOverrides) =>
  show({ ...(typeof options === 'string' ? { title: options } : options), message, type });
export const NToast = {
  show,
  success: status('success'),
  error: status('error'),
  info: status('info'),
  warning: status('warning'),
  dismiss: (id?: number) => enqueue({ action: 'dismiss', id }),
  clear: () => enqueue({ action: 'clear' })
};
export function performToastAction(id: number) {
  const action = actions.get(id);
  actions.delete(id);
  NToast.dismiss(id);
  action?.();
}
export const toastStore = {
  subscribe: toastSnapshot.subscribe,
  getSnapshot: toastSnapshot.getSnapshot,
  getServerSnapshot: toastSnapshot.getServerSnapshot,
  refresh: () => enqueue({ action: 'snapshot' })
};
