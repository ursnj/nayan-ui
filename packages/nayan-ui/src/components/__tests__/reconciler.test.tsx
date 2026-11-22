import { useState } from 'react';
import { expect, mock, test } from 'bun:test';
import { NAccordion } from '../NAccordion';
import { NButton } from '../NButton';
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
  const press = (index: number) => (renderer.handlers.get(triggers()[index]!.id)!.onPress as () => void)();
  try {
    renderer.render(<NAccordion items={items} expanded={true} onExpandedChange={onExpandedChange} />);
    await flush();
    expect(expansion()).toEqual([false, true, false]);
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

test('web linkify sends link classes to Rust without styling the surrounding paragraph', async () => {
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
      <NLinkify id="about" className="custom-link">
        Visit www.example.org.
      </NLinkify>
    );
    await flush();
    expect(nodes[0]?.props.linkify).toBe(true);
    expect(nodes[0]?.props.linkClassName).toBe('custom-link');
    expect(nodes[0]?.props.className).toBeUndefined();
    expect(nodes[0]?.children[0]?.props.text).toBe('Visit www.example.org.');
  } finally {
    renderer.dispose();
    await flush();
  }
});
