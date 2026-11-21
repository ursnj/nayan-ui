import { Window } from 'happy-dom';

/** Deterministic DOM for real React effects; no browser/GPU rendering is claimed here. */
export function installDom() {
  const window = new Window({ url: 'https://engine.test' });
  const descriptors = new Map<string, PropertyDescriptor | undefined>();
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Event', 'PointerEvent', 'MouseEvent', 'ResizeObserver'] as const) {
    descriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: name === 'window' ? window : window[name]
    });
  }
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
    configurable: true,
    value: true
  });
  return {
    window,
    cleanup() {
      window.happyDOM.abort();
      for (const [name, descriptor] of descriptors)
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else Reflect.deleteProperty(globalThis, name);
      Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
    }
  };
}

/** Shared component-test renderer, owned by the engine's existing development dependencies. */
export async function installReactTestEnvironment() {
  const dom = installDom();
  try {
    // React DOM detects browser capabilities at module load, after installing the DOM globals.
    const { createRoot } = await import('react-dom/client');
    return { ...dom, createRoot };
  } catch (error) {
    dom.cleanup();
    throw error;
  }
}
