import { createRef, useContext } from 'react';
import { beforeAll, expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { createBrowserEngine, type WasmCore } from '../../native/BrowserEngine';
import type { EngineBridge } from '../../native/EngineBridge';
import { NButton } from '../NButton';
import { NList, type NListRef, type NListRenderItemInfo } from '../NList';
import { NText } from '../NText';
import { createComponentRenderer } from '../reconciler';
import type { ComponentListPlan, ComponentRuntime } from '../runtime';
import { PageContentInsetsContext } from '../theme/contexts';
import type { ComponentNode } from '../types';

let engine: EngineBridge;

beforeAll(async () => {
  const { default: init } = await import('../../../native/core/build/web/engine_core.js');
  const core = await init({ module_or_path: await readFile(new URL('../../../native/core/build/web/engine_core_bg.wasm', import.meta.url)) });
  engine = createBrowserEngine(core as unknown as WasmCore);
});

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 30));
}

const players = Array.from({ length: 100_000 }, (_, index) => ({ id: String(index), name: `Player ${index}`, privateData: 'never sent' }));
const keyExtractor = (item: (typeof players)[number]) => item.id;

function setup() {
  let nodes: ComponentNode[] = [];
  const errors: unknown[] = [];
  const document = engine.drawingCreate(1, 1, 1);
  const request = (command: Record<string, unknown>) => {
    const result = JSON.parse(engine.drawingCommand(document, JSON.stringify({ op: 'components', ...command })));
    if (!result.ok) throw new RangeError(result.error);
    return result.value;
  };
  request({ action: 'tree', nodes: [] });
  const runtime: ComponentRuntime = {
    planList: (id, props) => request({ action: 'listPlan', id, props }),
    scrollList: (id, command) => {
      request({ action: 'listScroll', id, ...command });
    }
  };
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
      request({ action: 'tree', nodes: next });
    },
    (error) => errors.push(error),
    runtime
  );
  return {
    renderer,
    errors,
    node: () => nodes[0]!,
    plan: () => runtime.planList('list', nodes[0]!.props),
    async move(offset: number, notification: Partial<ComponentListPlan> = {}) {
      runtime.scrollList('list', { kind: 'offset', offset });
      const range = runtime.planList('list', nodes[0]!.props);
      const { onListLayout, onChange } = renderer.handlers.get('list') ?? {};
      if (typeof onListLayout !== 'function' || typeof onChange !== 'function') throw Error('Missing list handlers');
      onListLayout(range);
      if (Object.keys(notification).length) onChange({ ...range, ...notification });
      await flush();
      return range;
    },
    async dispose() {
      renderer.dispose();
      await flush();
      engine.drawingDestroy(document);
    }
  };
}

test('Rust requests a small row window for 100000 items without serializing application data', async () => {
  const ctx = setup();
  const renderItem = mock(({ item }: NListRenderItemInfo<(typeof players)[number]>) => <NText>{item.name}</NText>);
  try {
    ctx.renderer.render(
      <NList
        id="list"
        data={players}
        itemSize={40}
        height={200}
        overscan={2}
        initialNumToRender={10}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    );
    await flush();
    expect(ctx.errors).toEqual([]);
    expect(renderItem).toHaveBeenCalledTimes(12);
    expect(ctx.node().props.itemCount).toBe(100_000);
    expect(ctx.node().props.data).toBeUndefined();
    expect(JSON.stringify(ctx.node())).not.toContain('privateData');
    expect(JSON.stringify(ctx.node()).length).toBeLessThan(18000);
    await ctx.move(4000);
    const before = ctx.node().children.find((row) => row.props.index === 100)!.id;
    expect(ctx.node().children.map((row) => row.props.index)).toEqual([98, 99, 100, 101, 102, 103, 104, 105, 106]);
    expect(renderItem).toHaveBeenCalledTimes(21);
    await ctx.move(4040);
    expect(ctx.node().children.find((row) => row.props.index === 100)!.id).toBe(before);
    expect(renderItem).toHaveBeenCalledTimes(22);
  } finally {
    await ctx.dispose();
  }
});

test('memoized rows keep their item actions while extraData refreshes the mounted window', async () => {
  const ctx = setup();
  const press = mock((_id: string) => {});
  const renderItem = mock(({ item }: NListRenderItemInfo<(typeof players)[number]>) => (
    <NButton id={`player-${item.id}`} onPress={() => press(item.id)}>
      {item.name}
    </NButton>
  ));
  const render = (extraData: unknown) =>
    ctx.renderer.render(
      <NList
        id="list"
        data={players}
        itemSize={40}
        height={200}
        overscan={2}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        extraData={extraData}
      />
    );
  try {
    render(0);
    await flush();
    await ctx.move(4000);
    (ctx.renderer.handlers.get('player-100')!.onPress as () => void)();
    expect(press).toHaveBeenCalledWith('100');
    const before = renderItem.mock.calls.length;
    render(0);
    await flush();
    expect(renderItem).toHaveBeenCalledTimes(before);
    render(1);
    await flush();
    expect(renderItem).toHaveBeenCalledTimes(before + ctx.node().children.length);
    expect(ctx.errors).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

test('the React adapter forwards Rust notification flags and ignores stale dataset snapshots', async () => {
  const ctx = setup();
  const end = mock((_info: { distanceFromEnd: number }) => {});
  const visible = mock((_range: unknown) => {});
  const renderItem = ({ item }: NListRenderItemInfo<(typeof players)[number]>) => <NText>{item.name}</NText>;
  const render = (data: typeof players) =>
    ctx.renderer.render(
      <NList
        id="list"
        data={data}
        itemSize={40}
        height={200}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={end}
        onVisibleRangeChange={visible}
      />
    );
  try {
    render(players);
    await flush();
    const old = await ctx.move(4_000_000, { endReached: true, visibleChanged: true });
    expect(end).toHaveBeenCalledWith({ distanceFromEnd: 0 });
    expect(visible).toHaveBeenCalledWith({ first: 99995, last: 99999 });
    await ctx.move(4_000_000, { endReached: false, visibleChanged: false });
    expect(end).toHaveBeenCalledTimes(1);
    expect(visible).toHaveBeenCalledTimes(1);
    render([...players, { id: 'new', name: 'New player', privateData: '' }]);
    await flush();
    const handler = ctx.renderer.handlers.get('list')!.onChange as (range: ComponentListPlan) => void;
    handler({ ...old, endReached: true, visibleChanged: true });
    await flush();
    expect(end).toHaveBeenCalledTimes(1);
    await ctx.move(4_000_040, { endReached: true, visibleChanged: true });
    expect(end).toHaveBeenCalledTimes(2);
    expect(ctx.errors).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

test('imperative methods forward raw intents and Rust premounts, clamps and validates the target', async () => {
  const ctx = setup();
  const ref = createRef<NListRef>();
  try {
    ctx.renderer.render(
      <NList
        ref={ref}
        id="list"
        data={players}
        itemSize={40}
        height={200}
        overscan={2}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => <NText>{item.name}</NText>}
      />
    );
    await flush();
    ref.current!.scrollToIndex({ index: 500, viewPosition: 0.5 });
    await flush();
    expect(ctx.plan().offset).toBe(19920);
    expect(ctx.node().children.some((row) => row.props.index === 500)).toBe(true);
    expect(ctx.node().props.scrollOffset).toBeUndefined();
    expect(ctx.node().props.scrollSequence).toBeUndefined();
    ref.current!.scrollToEnd();
    await flush();
    expect(ctx.plan().offset).toBe(3999800);
    expect(ctx.node().children.at(-1)?.props.index).toBe(99999);
    expect(() => ref.current!.scrollToIndex({ index: -1 })).toThrow(RangeError);
    expect(() => ref.current!.scrollToOffset({ offset: NaN })).toThrow(RangeError);
    expect(() => ref.current!.scrollToIndex({ index: 1, viewPosition: 2 })).toThrow(RangeError);
    expect(ctx.errors).toEqual([]);
  } finally {
    await ctx.dispose();
  }
  expect(ref.current).toBeNull();
});

test('initial indices, separators, shrinking datasets and empty components use Rust ranges', async () => {
  const ctx = setup();
  const Empty = () => <NText>No players</NText>;
  const Separator = () => <NText>separator</NText>;
  const renderItem = mock(({ item }: NListRenderItemInfo<(typeof players)[number]>) => <NText>{item.name}</NText>);
  const render = (data: typeof players) =>
    ctx.renderer.render(
      <NList
        id="list"
        data={data}
        itemSize={40}
        initialScrollIndex={500}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={Empty}
        ItemSeparatorComponent={Separator}
      />
    );
  try {
    render(players);
    await flush();
    expect(ctx.plan().offset).toBe(20000);
    expect(ctx.node().children.some((row) => row.props.index === 500)).toBe(true);
    render(players.slice(0, 3));
    await flush();
    expect(ctx.node().children.map((row) => row.props.index)).toEqual([0, 1, 2]);
    expect(ctx.node().children[0]!.children).toHaveLength(2);
    expect(ctx.node().children[2]!.children).toHaveLength(1);
    render([]);
    await flush();
    expect(ctx.node().props.itemCount).toBe(0);
    expect(JSON.stringify(ctx.node())).toContain('No players');
    expect(ctx.errors).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

test('fractional row geometry stays in Rust and renders only its requested indices', async () => {
  const ctx = setup();
  try {
    ctx.renderer.render(
      <NList
        id="list"
        data={players}
        itemSize={40.1}
        height={200}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => <NText>{item.name}</NText>}
      />
    );
    await flush();
    const range = await ctx.move(4010);
    expect(ctx.node().children.map((row) => row.props.index)).toEqual(Array.from({ length: range.end - range.start }, (_, i) => i + range.start));
    expect(ctx.plan().itemSize).toBe(Math.fround(40.1));
    expect(ctx.errors).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

test('content container styles reach Rust without a padded wrapper around the viewport', async () => {
  const ctx = setup();
  try {
    ctx.renderer.render(
      <NList
        id="list"
        data={players}
        itemSize={40}
        height={200}
        contentContainerClassName="p-3"
        contentContainerStyle={[{ paddingTop: 8 }, { paddingBottom: 16 }]}
        renderItem={({ item }) => <NText>{item.name}</NText>}
      />
    );
    await flush();
    expect(ctx.errors).toEqual([]);
    expect(ctx.node().kind).toBe('NList');
    expect(ctx.node().props.contentContainerClassName).toBe('p-3');
    expect(ctx.node().props.contentContainerStyle).toEqual({ paddingTop: 8, paddingBottom: 16 });
  } finally {
    await ctx.dispose();
  }
});

test('page insets reach both Rust planning and rendering while nested rows do not inherit them', async () => {
  const ctx = setup();
  const area = { insets: { top: 0, right: 0, bottom: 34, left: 0 }, edges: { bottom: 'maximum' as const } };
  let nested: unknown = 'unmounted';
  function Row() {
    nested = useContext(PageContentInsetsContext);
    return <NText>Row</NText>;
  }
  try {
    ctx.renderer.render(
      <PageContentInsetsContext.Provider value={area}>
        <NList id="list" data={players.slice(0, 10)} itemSize={40} height={200} contentContainerClassName="p-3" renderItem={() => <Row />} />
      </PageContentInsetsContext.Provider>
    );
    await flush();
    expect(ctx.node().props.contentSafeArea).toEqual(area);
    expect(nested).toBeNull();
    const before = ctx.plan();
    const end = await ctx.move(1000);
    expect(end.configuration).toBe(before.configuration);
    expect(end.offset).toBe(246); // top 12 + rows 400 + bottom 34 - viewport 200
    expect(ctx.errors).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});
