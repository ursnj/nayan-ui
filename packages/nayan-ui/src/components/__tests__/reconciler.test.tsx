import { useState } from 'react';
import { expect, mock, test } from 'bun:test';
import { NAccordion } from '../NAccordion';
import { NButton } from '../NButton';
import { NButtonGroup } from '../NButtonGroup';
import { NScrollView } from '../NScrollView';
import { NText } from '../NText';
import { NView } from '../NView';
import { createComponentRenderer } from '../reconciler';
import type { ComponentNode } from '../types';

const platform = await import('../PlatformHost');
mock.module('../PlatformHost', () => ({ ...platform, IconHost: () => null }));
const { NIcon } = await import('../icons');

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 30));
}

test('React hooks update Rust descriptions and callbacks never cross the bridge', async () => {
  let nodes: ComponentNode[] = [];
  const errors: unknown[] = [];
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
    },
    (error) => errors.push(error)
  );
  function Counter() {
    const [count, setCount] = useState(0);

    return (
      <NButton id="counter" onPress={() => setCount((value) => value + 1)}>
        {count}
      </NButton>
    );
  }
  renderer.render(<Counter />);
  await flush();
  expect(errors).toEqual([]);
  expect(nodes[0]?.children[0]?.props.text).toBe('0');
  expect(nodes[0]?.props.onPress).toBeUndefined();
  const callback = renderer.handlers.get('counter')?.onPress;
  if (typeof callback !== 'function') throw new Error('Missing callback');
  callback();
  await flush();
  expect(nodes[0]?.children[0]?.props.text).toBe('1');
  renderer.dispose();
  await flush();
  expect(nodes).toEqual([]);
  expect(renderer.handlers.size).toBe(0);
});

test('keyed children retain their IDs when moved or updated', async () => {
  let nodes: ComponentNode[] = [];
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
    },
    (error) => {
      throw error;
    }
  );
  renderer.render([<NText key="a">A</NText>, <NText key="b">B</NText>]);
  await flush();
  const first = nodes.map((n) => n.id);
  renderer.render([<NText key="b">B2</NText>, <NText key="a">A</NText>]);
  await flush();
  expect(nodes.map((n) => n.id)).toEqual([first[1]!, first[0]!]);
  expect(nodes[0]?.children[0]?.props.text).toBe('B2');
  renderer.dispose();
  await flush();
});

test('accordion expansion follows controlled props and preserves multiple batched presses', async () => {
  const items = [
    { id: 'unavailable', title: 'Unavailable', message: 'Disabled panel', disabled: true },
    { id: 'first', title: 'First', message: 'First panel' },
    { id: 'second', title: 'Second', message: 'Second panel' }
  ];
  const onExpandedChange = mock((_expanded: boolean) => {});
  let nodes: ComponentNode[] = [];
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
    },
    (error) => {
      throw error;
    }
  );
  const triggers = () => nodes[0]!.children.map((item) => item.children[0]!);
  const expansion = () => triggers().map((trigger) => trigger.props._expanded);
  const bodies = () => nodes[0]!.children.map((item) => item.children[1]!.props.className);
  const press = (index: number) => (renderer.handlers.get(triggers()[index]!.id)!.onPress as () => void)();
  try {
    renderer.render(<NAccordion items={items} expanded={true} onExpandedChange={onExpandedChange} />);
    await flush();
    expect(expansion()).toEqual([false, true, false]);
    expect(bodies()[0]).toBe('hidden');
    expect(bodies()[1]).toContain('pb-3.5');
    expect(bodies()[2]).toBe('hidden');
    press(0);
    press(1);
    await flush();
    expect(onExpandedChange.mock.calls).toEqual([[false]]);
    expect(expansion()).toEqual([false, true, false]);

    renderer.render(<NAccordion items={items} expanded={false} onExpandedChange={onExpandedChange} />);
    await flush();
    press(2);
    await flush();
    expect(onExpandedChange.mock.calls).toEqual([[false], [true]]);
    expect(expansion()).toEqual([false, false, false]);
    renderer.render(<NAccordion items={items} expanded={true} />);
    await flush();
    expect(expansion()).toEqual([false, false, true]);

    onExpandedChange.mockClear();
    renderer.render(<NAccordion key="uncontrolled" items={items} type="multiple" defaultExpanded onExpandedChange={onExpandedChange} />);
    await flush();
    expect(expansion()).toEqual([false, true, false]);
    press(2);
    press(1);
    await flush();
    expect(expansion()).toEqual([false, false, true]);
    expect(onExpandedChange).not.toHaveBeenCalled();
    press(2);
    await flush();
    expect(expansion()).toEqual([false, false, false]);
    expect(onExpandedChange.mock.calls).toEqual([[false]]);
  } finally {
    renderer.dispose();
    await flush();
  }
});

test('button group emits connected segments and preserves controlled and uncontrolled selection', async () => {
  const items = [
    { label: 'First', value: 'first' },
    { label: 'Second', value: 'second' },
    { label: 'Third', value: 'third', disabled: true }
  ];
  const onChange = mock((_value: string) => {});
  let nodes: ComponentNode[] = [];
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
    },
    (error) => {
      throw error;
    }
  );
  const segments = () => nodes[0]!.children[0]!.children;
  const selection = () => segments().map((segment) => segment.props._selected);
  const press = (index: number) => (renderer.handlers.get(segments()[index]!.id)!.onPress as () => void)();
  try {
    renderer.render(<NButtonGroup items={items} selected={{ ...items[0]! }} onChange={onChange} />);
    await flush();
    expect(selection()).toEqual([true, false, false]);
    expect(segments().map((segment) => String(segment.props.className).match(/rounded-[lr]-full/g))).toEqual([
      ['rounded-l-full'],
      null,
      ['rounded-r-full']
    ]);
    press(2);
    press(1);
    await flush();
    expect(onChange.mock.calls).toEqual([['second']]);
    expect(selection()).toEqual([true, false, false]);

    renderer.render(<NButtonGroup key="uncontrolled" options={items} defaultValue="first" onValueChange={onChange} />);
    await flush();
    press(1);
    await flush();
    expect(selection()).toEqual([false, true, false]);
    expect(onChange.mock.calls).toEqual([['second'], ['second']]);
  } finally {
    renderer.dispose();
    await flush();
  }
});

test('Unicode icon names reach Rust without changing the public component syntax', async () => {
  let nodes: ComponentNode[] = [];
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
    },
    (error) => {
      throw error;
    }
  );
  renderer.render(<NIcon name="🎮" accessibilityLabel="Games" />);
  await flush();
  expect(nodes[0]?.props.name).toBe('🎮');
  expect(nodes[0]?.props.accessibilityLabel).toBe('Games');
  renderer.dispose();
  await flush();
});

test('horizontal scrolling preserves content spacing independently of its viewport', async () => {
  let nodes: ComponentNode[] = [];
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
    },
    (error) => {
      throw error;
    }
  );
  renderer.render(
    <NScrollView horizontal className="h-24" style={{ width: 240 }} contentContainerClassName="gap-3" contentContainerStyle={{ padding: 12 }}>
      <NView width={80} height={60} />
      <NView width={80} height={60} />
    </NScrollView>
  );
  await flush();
  expect(nodes[0]?.props.style).toEqual({ width: 240 });
  expect(nodes[0]?.children[0]?.props.className).toContain('gap-3');
  expect(nodes[0]?.children[0]?.props.style).toEqual({ padding: 12 });
  expect(nodes[0]?.children[0]?.children).toHaveLength(2);
  renderer.dispose();
  await flush();
});

test('web linkify sends children and link classes to Rust and accepts legacy text', async () => {
  const { NLinkify } = await import('../NLinkify.web');
  let nodes: ComponentNode[] = [];
  const renderer = createComponentRenderer(
    (next) => {
      nodes = next;
    },
    (error) => {
      throw error;
    }
  );
  try {
    renderer.render(
      <>
        <NLinkify id="about" className="custom-link" text="Unused fallback">
          Visit www.example.org.
        </NLinkify>
        <NLinkify id="legacy" text="Email help@example.org." />
      </>
    );
    await flush();
    expect(nodes[0]?.props.linkify).toBe(true);
    expect(nodes[0]?.props.linkClassName).toBe('custom-link');
    expect(nodes[0]?.props.className).toBeUndefined();
    expect(nodes[0]?.props.text).toBeUndefined();
    expect(nodes[0]?.children[0]?.props.text).toBe('Visit www.example.org.');
    expect(nodes[1]?.children[0]?.props.text).toBe('Email help@example.org.');
  } finally {
    renderer.dispose();
    await flush();
  }
});
