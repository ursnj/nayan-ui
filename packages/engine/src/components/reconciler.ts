import { createContext, createElement, type ReactNode } from 'react';
import Reconciler, { type HostConfig } from 'react-reconciler';
import { ConcurrentRoot, DefaultEventPriority, NoEventPriority } from 'react-reconciler/constants';
import { type ComponentRuntime, ComponentRuntimeContext } from './runtime';
import { ComponentRenderContext } from './ThemeContext';
import type { ComponentNode } from './types';

interface Instance {
  id: string;
  kind: string;
  props: Record<string, unknown>;
  children: Instance[];
  hidden?: boolean;
}

interface Container {
  commits: number;
  children: Instance[];
  nextId: number;
  commit: (nodes: ComponentNode[]) => void;
}

type Config = HostConfig<
  string,
  Record<string, unknown>,
  Container,
  Instance,
  Instance,
  never,
  never,
  never,
  Instance,
  Instance,
  object,
  never,
  ReturnType<typeof setTimeout>,
  -1,
  null,
  null,
  null,
  never,
  never,
  never
>;

const emptyContext = {};
const noop = () => {};
let priority = NoEventPriority;

function remove(parent: { children: Instance[] }, child: Instance) {
  const index = parent.children.indexOf(child);
  if (index >= 0) parent.children.splice(index, 1);
}

function append(parent: { children: Instance[] }, child: Instance) {
  remove(parent, child);
  parent.children.push(child);
}

function insert(parent: { children: Instance[] }, child: Instance, before: Instance) {
  remove(parent, child);
  parent.children.splice(parent.children.indexOf(before), 0, child);
}

function serialize(children: Instance[], handlers: Map<string, Record<string, unknown>>): ComponentNode[] {
  return children
    .filter((c) => !c.hidden && c.kind !== 'script' && c.kind !== 'style')
    .map((c) => {
      const id = typeof c.props.id === 'string' ? c.props.id : c.id;
      handlers.set(id, { ...c.props, __uiKind: c.kind });
      const props = Object.fromEntries(
        Object.entries(c.props).filter(([key, value]) => key !== 'children' && key !== 'ref' && typeof value !== 'function')
      );
      if (typeof c.props.onVisibleChange === 'function') props.observedVisible = true;
      return { id, kind: c.kind, props, children: serialize(c.children, handlers) };
    });
}

const config: Config = {
  rendererVersion: '1.0.0',
  rendererPackageName: '@nayan-ui/engine/components',
  extraDevToolsConfig: null,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: false,
  createInstance: (kind, props, root) => ({ id: `ui-${root.nextId++}`, kind, props, children: [] }),
  createTextInstance: (text, root) => ({ id: `ui-${root.nextId++}`, kind: 'NText', props: { text }, children: [] }),
  appendInitialChild: append,
  appendChild: append,
  appendChildToContainer: append,
  insertBefore: insert,
  insertInContainerBefore: insert,
  removeChild: remove,
  removeChildFromContainer: remove,
  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,
  getRootHostContext: () => emptyContext,
  getChildHostContext: () => emptyContext,
  getPublicInstance: (instance) => instance,
  prepareForCommit: () => null,
  resetAfterCommit: (root) => root.commit([]),
  preparePortalMount: noop,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  supportsMicrotasks: true,
  scheduleMicrotask: queueMicrotask,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur: noop,
  afterActiveInstanceBlur: noop,
  prepareScopeUpdate: noop,
  getInstanceFromScope: () => null,
  detachDeletedInstance: noop,
  commitUpdate: (instance, _kind, _old, props) => {
    instance.props = props;
  },
  commitTextUpdate: (instance, _old, text) => {
    instance.props = { text };
  },
  resetTextContent: (instance) => {
    instance.children = [];
  },
  hideInstance: (instance) => {
    instance.hidden = true;
  },
  hideTextInstance: (instance) => {
    instance.hidden = true;
  },
  unhideInstance: (instance) => {
    instance.hidden = false;
  },
  unhideTextInstance: (instance) => {
    instance.hidden = false;
  },
  clearContainer: (root) => {
    root.children = [];
  },
  NotPendingTransition: null,
  HostTransitionContext: /* @__PURE__ */ createContext(null) as unknown as Config['HostTransitionContext'],
  setCurrentUpdatePriority: (p) => {
    priority = p;
  },
  getCurrentUpdatePriority: () => priority,
  resolveUpdatePriority: () => priority || DefaultEventPriority,
  resetFormInstance: noop,
  requestPostPaintCallback: (callback) => {
    setTimeout(() => callback(performance.now()), 0);
  },
  shouldAttemptEagerTransition: () => false,
  trackSchedulerEvent: noop,
  resolveEventType: () => null,
  resolveEventTimeStamp: () => performance.now(),
  maySuspendCommit: () => false,
  maySuspendCommitOnUpdate: () => false,
  maySuspendCommitInSyncRender: () => false,
  preloadInstance: () => true,
  startSuspendingCommit: () => null,
  suspendInstance: noop,
  suspendOnActiveViewTransition: noop,
  waitForCommitToBeReady: () => null,
  getSuspendedCommitReason: () => null,
  bindToConsole: (_method, _args, _badge) => noop
};

const renderer = /* @__PURE__ */ Reconciler(config);

/** A separate React renderer permits hooks and keyed reconciliation without platform UI widgets. */
export function createComponentRenderer(commit: (nodes: ComponentNode[]) => void, onError: (error: unknown) => void, runtime?: ComponentRuntime) {
  const handlers = new Map<string, Record<string, unknown>>();
  const container: Container = {
    commits: 0,
    children: [],
    nextId: 1,
    commit: () => {
      container.commits++;
      handlers.clear();
      commit(serialize(container.children, handlers));
    }
  };
  const root = renderer.createContainer(container, ConcurrentRoot, null, false, null, 'nayan-ui', onError, onError, onError, noop, null);
  return {
    handlers,
    render(children: ReactNode) {
      const previous = container.commits;
      const content = createElement(ComponentRenderContext.Provider, { value: true }, children);
      renderer.updateContainer(runtime ? createElement(ComponentRuntimeContext.Provider, { value: runtime }, content) : content, root, null, () => {
        if (container.commits === previous) container.commit([]);
      });
    },
    dispose() {
      renderer.updateContainer(null, root, null, noop);
    }
  };
}
