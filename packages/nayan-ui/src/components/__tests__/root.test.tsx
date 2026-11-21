import { act, createContext, type PropsWithChildren, useContext, useEffect } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { installDom } from '../../__tests__/dom';
import { NButton } from '../NButton';
import { NImage } from '../NImage';
import { NInput } from '../NInput';
import { NLinkify } from '../NLinkify';
import { NSelect } from '../NSelect';
import { NText } from '../NText';
import { NView } from '../NView';
import { SafeAreaFrameContext, SafeAreaInsetsContext, useNSafeAreaFrame, useNSafeAreaInsets } from '../safeAreaContext';
import { DrawerContext } from '../theme/contexts';
import type { ComponentNode, ComponentSemantic, ComponentSnapshot } from '../types';
import { type NThemeState, useNTheme } from '../useNTheme';

const platform = await import('../PlatformHost');
mock.module('../PlatformHost', () => ({ ...platform, IconHost: () => null, usePlatformColorScheme: () => 'light' }));
mock.module('../NSafeArea', () => ({ NSafeAreaProvider: ({ children }: PropsWithChildren) => children }));
const { NIcon } = await import('../icons');

const opened: string[] = [];
let trees: ComponentNode[] = [];
let treeCommits = 0;
let accept: (snapshot: ComponentSnapshot) => void;
let snapshot: ComponentSnapshot;
let host: { document: unknown; active?: boolean };
const dispatched: Record<string, unknown>[] = [];
mock.module('../themeSystemBars', () => ({ useThemeSystemBars() {} }));
const { NTheme } = await import('../NTheme');

mock.module('../../native/prepare', () => ({ prepareEngine: async () => {} }));

mock.module('../ComponentDocument', () => ({
  ComponentDocument: class {
    isDisposed = false;
    hasPendingControlledEdit = false;
    setTree(nodes: ComponentNode[]) {
      treeCommits++;
      trees = nodes;
    }

    request() {}

    dispatch(command: Record<string, unknown>) {
      dispatched.push(command);
    }

    readResources() {
      if (this.isDisposed) throw Error('Disposed resource read');
    }

    dispose() {
      this.isDisposed = true;
    }
  }
}));

mock.module('../ComponentHost', () => ({
  ComponentHost: (props: { document: unknown; active?: boolean; snapshot: ComponentSnapshot; onSnapshot: (snapshot: ComponentSnapshot) => void }) => {
    host = props;
    snapshot = props.snapshot;
    accept = props.onSnapshot;
    return null;
  },
  inputEventValue: (value: string) => value,
  selectEventValue: (value: unknown) => value,
  openLink: (href: string) => {
    opened.push(href);
  }
}));

const dom = installDom();
const { createRoot } = await import('react-dom/client');
const { ComponentsRoot } = await import('../ComponentsRoot');

afterAll(() => dom.cleanup());

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 35));
  });
}

test('visual controls require an app renderer without starting a standalone surface', () => {
  expect(() => renderToStaticMarkup(<NView />)).toThrow('NView requires an app-level NPage or ComponentsRoot');
  expect(() => renderToStaticMarkup(<NButton>Action</NButton>)).toThrow('NButton requires an app-level NPage or ComponentsRoot');
});

test('nested ComponentsRoot uses the app document and keeps it when paused', async () => {
  const root = createRoot(document.createElement('div'));
  const nestedReady = mock(() => {});
  const render = (active: boolean) => (
    <ComponentsRoot active={active}>
      <NView>
        <ComponentsRoot onReady={nestedReady}>
          <NButton id="nested">Action</NButton>
        </ComponentsRoot>
      </NView>
    </ComponentsRoot>
  );
  try {
    await act(() => root.render(render(true)));
    await flush();
    const document = host.document;
    expect(trees[0]?.children[0]?.props.id).toBe('nested');
    expect(nestedReady).not.toHaveBeenCalled();
    await act(() => root.render(render(false)));
    await flush();
    expect(host.active).toBe(false);
    expect(host.document).toBe(document);
    expect(trees[0]?.children[0]?.props.id).toBe('nested');
  } finally {
    await act(() => root.unmount());
    await flush();
  }
});

test('navigation and temporary pauses retain the document and reset scrolling only for a new route', async () => {
  const root = createRoot(document.createElement('div'));
  const stylesheet = 'data:application/json,{"rules":[]}';
  const page = (scrollKey: string, active = true) => (
    <ComponentsRoot stylesheet={stylesheet} scrollKey={scrollKey} active={active}>
      <NText>{scrollKey}</NText>
    </ComponentsRoot>
  );
  dispatched.length = 0;
  const scrollCommands = () => dispatched.filter((command) => command.action === 'pageScroll');
  try {
    await act(() => root.render(page('/games')));
    await flush();
    const document = host.document;
    expect(scrollCommands()).toEqual([{ action: 'pageScroll', offset: 0 }]);
    await act(() => root.render(page('/games', false)));
    expect(host.document).toBe(document);
    expect(host.active).toBe(false);
    expect(scrollCommands()).toHaveLength(1);
    await act(() => root.render(page('/account')));
    await flush();
    expect(host.document).toBe(document);
    expect(host.active).toBe(true);
    expect(scrollCommands()).toEqual([
      { action: 'pageScroll', offset: 0 },
      { action: 'pageScroll', offset: 0 }
    ]);
  } finally {
    await act(() => root.unmount());
  }
});

test('surface readiness waits for its first presented snapshot and fires once across callback updates', async () => {
  const ready = mock(() => {});
  const updated = mock(() => {});
  const root = createRoot(document.createElement('div'));
  await act(() =>
    root.render(
      <ComponentsRoot onReady={ready}>
        <NText>Ready</NText>
      </ComponentsRoot>
    )
  );
  await flush();
  expect(ready).not.toHaveBeenCalled();
  await act(() => accept({ revision: 1, nodes: [], events: [] }));
  expect(ready).toHaveBeenCalledTimes(1);
  await act(() =>
    root.render(
      <ComponentsRoot onReady={updated}>
        <NText>Updated</NText>
      </ComponentsRoot>
    )
  );
  await flush();
  await act(() => accept({ revision: 2, nodes: [], events: [] }));
  expect(updated).not.toHaveBeenCalled();
  const late = accept;
  await act(() => root.unmount());
  late({ revision: 3, nodes: [], events: [] });
  expect(updated).not.toHaveBeenCalled();
  const nextRoot = createRoot(document.createElement('div'));
  try {
    await act(() =>
      nextRoot.render(
        <ComponentsRoot onReady={updated}>
          <NText>New surface</NText>
        </ComponentsRoot>
      )
    );
    await flush();
    await act(() => accept({ revision: 1, nodes: [], events: [] }));
    expect(updated).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => nextRoot.unmount());
  }
});

test('controlled consumers rejecting an edit with an unchanged value still reconcile their props', async () => {
  const root = createRoot(document.createElement('div'));
  try {
    await act(() =>
      root.render(
        <ComponentsRoot>
          <NInput id="fixed" value="A" onChange={() => {}} />
        </ComponentsRoot>
      )
    );
    await flush();
    const before = treeCommits;
    (host.document as { hasPendingControlledEdit: boolean }).hasPendingControlledEdit = true;
    await act(() => accept({ partial: true, revision: 1, nodes: [], events: [{ id: 'fixed', type: 'change', value: 'AB', sequence: 1 }] }));
    await flush();
    expect(treeCommits).toBeGreaterThan(before);
    expect(trees[0]?.props.value).toBe('A');
  } finally {
    await act(() => root.unmount());
    await flush();
  }
});

test('partial input acknowledgements preserve other nodes, geometry and resource requests', async () => {
  const root = createRoot(document.createElement('div'));
  const changed = mock((_value: string) => {});
  try {
    await act(() =>
      root.render(
        <ComponentsRoot>
          <NInput id="field" onChangeText={changed} />
          <NText id="other">Other</NText>
        </ComponentsRoot>
      )
    );
    await flush();
    const field = { id: 'field', kind: 'NInput', value: 'A', rect: [0, 0, 200, 48], platformEdit: false } as ComponentSemantic;
    const other = { ...field, id: 'other', kind: 'NText' };
    const full: ComponentSnapshot = {
      revision: 10,
      nodes: [field, other],
      events: [],
      inputFields: ['field'],
      contentSize: [200, 300],
      overlays: { photo: [0, 0, 10, 10] },
      imageRequests: []
    };
    await act(() => accept(full));
    const ack: ComponentSnapshot = {
      partial: true,
      revision: 11,
      nodes: [{ ...field, value: 'AB', platformEdit: true }],
      events: [{ id: 'field', type: 'change', value: 'AB', sequence: 11 }]
    };
    await act(() => accept(ack));
    expect(snapshot.nodes[0]?.value).toBe('AB');
    expect(snapshot.nodes[1]).toBe(other);
    expect(snapshot.overlays).toBe(full.overlays);
    expect(snapshot.inputFields).toBe(full.inputFields);
    expect(snapshot.imageRequests).toBe(full.imageRequests);
    await act(() => accept(ack));
    expect(changed.mock.calls).toEqual([['AB']]);
  } finally {
    await act(() => root.unmount());
    await flush();
  }
});

test('late native frames cannot overwrite an IME acknowledgement or replay older field changes', async () => {
  const changed = mock((_value: string) => {});
  const otherChanged = mock((_value: string) => {});
  const pressed = mock(() => {});
  const root = createRoot(document.createElement('div'));
  try {
    await act(async () =>
      root.render(
        <ComponentsRoot>
          <NInput id="input" onChangeText={changed} />
          <NInput id="other" onChangeText={otherChanged} />
          <NButton id="save" onPress={pressed}>
            Save
          </NButton>
        </ComponentsRoot>
      )
    );
    await flush();
    await act(() => accept({ revision: 12, nodes: [], events: [{ id: 'input', type: 'change', value: '123', sequence: 12 }] }));
    await act(() =>
      accept({
        revision: 11,
        nodes: [],
        events: [
          { id: 'input', type: 'change', value: '12', sequence: 9 },
          { id: 'other', type: 'change', value: 'Ada', sequence: 10 },
          { id: 'save', type: 'press', sequence: 11 }
        ]
      })
    );
    expect(snapshot.revision).toBe(12);
    expect(changed.mock.calls).toEqual([['123']]);
    expect(otherChanged.mock.calls).toEqual([['Ada']]);
    expect(pressed).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
    await flush();
  }
});

test('image lifecycle events preserve native/web payloads and late snapshots cannot replay callbacks', async () => {
  const start = mock(() => {});
  const load = mock((_event: unknown) => {});
  const error = mock((_event: unknown) => {});
  const end = mock(() => {});
  const root = createRoot(document.createElement('div'));
  try {
    await act(async () =>
      root.render(
        <ComponentsRoot>
          <NImage id="photo" source="avatar.png" onLoadStart={start} onLoad={load} onError={error} onLoadEnd={end} />
        </ComponentsRoot>
      )
    );
    await flush();
    const next: ComponentSnapshot = {
      revision: 24,
      nodes: [],
      events: [
        { id: 'photo', type: 'loadStart', sequence: 20 },
        { id: 'photo', type: 'load', sequence: 21, value: { width: 128, height: 64, uri: 'avatar.png' } },
        { id: 'photo', type: 'loadEnd', sequence: 22 }
      ]
    };
    await act(() => accept(next));
    await act(() => accept(next));
    expect(start).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    expect(load.mock.calls).toEqual([
      [{ source: { width: 128, height: 64, url: 'avatar.png' }, nativeEvent: { source: { width: 128, height: 64, uri: 'avatar.png' } } }]
    ]);
    await act(() => accept({ revision: 27, nodes: [], events: [{ id: 'photo', type: 'error', sequence: 26, value: { error: 'HTTP 404' } }] }));
    expect(error.mock.calls).toEqual([[{ error: 'HTTP 404', nativeEvent: { error: 'HTTP 404' } }]]);
  } finally {
    await act(async () => root.unmount());
    await flush();
  }
});

test('one app theme bridges services and named icons into every independent surface', async () => {
  const Services = createContext('missing');
  const Providers = ({ children }: PropsWithChildren) => <Services.Provider value="connected">{children}</Services.Provider>;
  function Content() {
    return (
      <>
        <NText>{useContext(Services)}</NText>
        <NIcon name="house" />
      </>
    );
  }
  const root = createRoot(document.createElement('div'));
  const colors = { foreground: '#123456' };
  try {
    await act(() =>
      root.render(
        <NTheme theme="dark" colors={colors} providers={Providers}>
          <ComponentsRoot>
            <Content />
          </ComponentsRoot>
        </NTheme>
      )
    );
    await flush();
    expect(trees[0]?.kind).toBe('NTheme');
    expect(trees[0]?.props.colors).toEqual(colors);
    const json = JSON.stringify(trees);
    expect(json).toContain('connected');
    expect(json).toContain('house');
    expect(json).toContain('strokeWidth');
    expect(json).not.toContain('iconFont');
    expect(json).not.toContain('providers');
    await act(() =>
      root.render(
        <NTheme theme="light" colors={{ foreground: '#654321' }} providers={Providers}>
          <ComponentsRoot>
            <Content />
          </ComponentsRoot>
        </NTheme>
      )
    );
    await flush();
    expect(trees[0]?.props.theme).toBe('light');
    expect(trees[0]?.props.colors).toEqual({ foreground: '#654321' });
  } finally {
    await act(() => root.unmount());
    await flush();
  }
});

test('registered application contexts capture the nearest provider and update without remounting the surface', async () => {
  const Session = createContext('outside');
  const contexts = [Session];
  let mounts = 0;
  function Content() {
    const session = useContext(Session);
    const drawer = useContext(DrawerContext);
    useEffect(() => {
      mounts++;
    }, []);
    return (
      <NText>
        {session}:{drawer?.isOpen ? 'open' : 'closed'}
      </NText>
    );
  }
  const root = createRoot(document.createElement('div'));
  const app = (session: string) => (
    <NTheme contexts={contexts}>
      <Session.Provider value={session}>
        <DrawerContext.Provider value={{ isOpen: session === 'signed-in', open() {}, close() {}, toggle() {} }}>
          <ComponentsRoot>
            <Content />
          </ComponentsRoot>
        </DrawerContext.Provider>
      </Session.Provider>
    </NTheme>
  );
  try {
    await act(() => root.render(app('signed-in')));
    await flush();
    const document = host.document;
    const node = trees[0]?.children?.[0]?.id;
    expect(JSON.stringify(trees)).toContain('signed-in');
    expect(JSON.stringify(trees)).toContain('open');
    expect(JSON.stringify(trees)).not.toContain('contexts');
    await act(() => root.render(app('signed-out')));
    await flush();
    expect(JSON.stringify(trees)).toContain('signed-out');
    expect(JSON.stringify(trees)).toContain('closed');
    expect(trees[0]?.children?.[0]?.id).toBe(node);
    expect(host.document).toBe(document);
    expect(mounts).toBe(1);
  } finally {
    await act(() => root.unmount());
    await flush();
  }
});

test('theme hooks inside an engine surface update the owning root without serializing control state or remounting', async () => {
  let state: NThemeState;
  let mounts = 0;
  let saved = 'light';
  const storage = {
    getString: () => saved,
    set: (_key: string, value: unknown) => {
      saved = String(value);
    },
    subscribe: () => () => {}
  };
  function Controls() {
    state = useNTheme();
    useEffect(() => {
      mounts++;
    }, []);
    return <NText>{state.resolvedTheme}</NText>;
  }
  const root = createRoot(document.createElement('div'));
  try {
    await act(() =>
      root.render(
        <NTheme
          defaultTheme="light"
          persistence={{ storage }}
          palettes={{ light: { accent: '#123456', chartOpacity: 0.4 }, dark: { accent: '#abcdef', chartOpacity: 0.2 } }}
          components={({ isDarkMode }) => ({ NCard: { className: isDarkMode ? 'shadow-lg' : 'shadow-sm' } })}
        >
          <ComponentsRoot>
            <Controls />
          </ComponentsRoot>
        </NTheme>
      )
    );
    await flush();
    const document = host.document;
    await act(() => state!.setTheme('dark'));
    await flush();
    expect(trees[0]?.props.theme).toBe('dark');
    expect(saved).toBe('dark');
    expect(state!.palette.chartOpacity).toBe(0.2);
    expect(state!.colors.accent).toBe('#abcdef');
    expect(trees[0]?.props.components).toMatchObject({ NCard: { className: 'shadow-lg' } });
    expect(JSON.stringify(trees)).toContain('dark');
    for (const key of ['setTheme', 'toggleTheme', 'defaultTheme', 'onThemeChange', 'persistence', 'palettes', 'getString', 'subscribe'])
      expect(JSON.stringify(trees)).not.toContain(key);
    expect(host.document).toBe(document);
    expect(mounts).toBe(1);
  } finally {
    await act(() => root.unmount());
    await flush();
  }
});

test('Rust-created inline URL targets open once even when a native snapshot is delivered twice', async () => {
  const root = createRoot(document.createElement('div'));
  opened.length = 0;
  try {
    await act(() =>
      root.render(
        <ComponentsRoot>
          <NText>Links</NText>
        </ComponentsRoot>
      )
    );
    await flush();
    const value: ComponentSnapshot = {
      revision: 100,
      nodes: [],
      events: [{ id: 'paragraph:url:8', type: 'press', value: { href: 'https://example.com' }, sequence: 100 }]
    };
    await act(() => accept(value));
    await act(() => accept(value));
    expect(opened).toEqual(['https://example.com']);
  } finally {
    await act(() => root.unmount());
    await flush();
  }
});

test('late frames after a toast or screen surface unmount do not dispatch stale callbacks', async () => {
  const root = createRoot(document.createElement('div'));
  const press = mock(() => {});
  await act(async () =>
    root.render(
      <ComponentsRoot>
        <NButton id="late" onPress={press}>
          Save
        </NButton>
      </ComponentsRoot>
    )
  );
  await flush();
  const late = accept;
  await act(async () => root.unmount());
  expect(() => late({ revision: 999, nodes: [], events: [{ id: 'late', type: 'press', sequence: 999 }] })).not.toThrow();
  expect(press).not.toHaveBeenCalled();
});

test('select aliases preserve option arrays and linkify forwards the matched URL and text', async () => {
  const single = mock((_value: unknown) => {});
  const multi = mock((_value: unknown) => {});
  const keys = mock((_value: unknown) => {});
  const ignored = mock((_value: unknown) => {});
  const link = mock((_href: string, _text: string) => {});
  const navigate = mock((_href: string) => {});
  const options = [
    { label: 'Apple', value: 'a' },
    { label: 'Banana', value: 'b' }
  ];
  const root = createRoot(document.createElement('div'));
  try {
    await act(() =>
      root.render(
        <ComponentsRoot onNavigate={navigate}>
          <NSelect id="single" options={options} onChangeOptions={single} />
          <NSelect id="multi" isMulti options={options} onChangeOptions={multi} onValueChange={ignored} />
          <NSelect id="keys" isMulti options={options} onValueChange={keys} />
          <NLinkify id="custom-link" onPress={link}>
            www.example.org
          </NLinkify>
          <NLinkify id="default-link">hi@example.org</NLinkify>
        </ComponentsRoot>
      )
    );
    await flush();
    await act(() =>
      accept({
        revision: 6,
        nodes: [],
        events: [
          { id: 'single', type: 'change', value: options[0], sequence: 1 },
          { id: 'multi', type: 'change', value: options, sequence: 2 },
          { id: 'keys', type: 'change', value: options, sequence: 3 },
          { id: 'custom-link', type: 'press', value: { href: 'https://www.example.org', text: 'www.example.org', linkify: true }, sequence: 4 },
          { id: 'default-link', type: 'press', value: { href: 'mailto:hi@example.org', text: 'hi@example.org', linkify: true }, sequence: 5 },
          { id: 'single', type: 'change', value: null, sequence: 6 }
        ]
      })
    );
    expect(single.mock.calls).toEqual([[options[0]], [null]]);
    expect(multi.mock.calls).toEqual([[options]]);
    expect(keys.mock.calls).toEqual([[['a', 'b']]]);
    expect(ignored).not.toHaveBeenCalled();
    expect(link.mock.calls).toEqual([['https://www.example.org', 'www.example.org']]);
    expect(navigate.mock.calls).toEqual([['mailto:hi@example.org']]);
    expect(trees.find((node) => node.id === 'custom-link')?.props.linkify).toBe(true);
    expect(trees.find((node) => node.id === 'multi')?.props.isMulti).toBe(true);
  } finally {
    await act(() => root.unmount());
  }
});

test('safe-area hooks retain their app provider across the independent Rust UI renderer', async () => {
  function Content() {
    return <NText>{JSON.stringify({ insets: useNSafeAreaInsets(), frame: useNSafeAreaFrame() })}</NText>;
  }
  const root = createRoot(document.createElement('div'));
  const frame = { x: 0, y: 0, width: 402, height: 874 };
  const render = (top: number) => (
    <SafeAreaInsetsContext.Provider value={{ top, right: 0, bottom: 34, left: 0 }}>
      <SafeAreaFrameContext.Provider value={frame}>
        <ComponentsRoot>
          <Content />
        </ComponentsRoot>
      </SafeAreaFrameContext.Provider>
    </SafeAreaInsetsContext.Provider>
  );
  try {
    await act(() => root.render(render(62)));
    await flush();
    expect(JSON.stringify(trees)).toContain('\\"top\\":62');
    expect(JSON.stringify(trees)).toContain('\\"width\\":402');
    await act(() => root.render(render(0)));
    await flush();
    expect(JSON.stringify(trees)).toContain('\\"top\\":0');
  } finally {
    await act(() => root.unmount());
    await flush();
  }
});
