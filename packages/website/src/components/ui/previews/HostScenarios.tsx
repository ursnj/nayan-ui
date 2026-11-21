import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as E from '@nayan-ui/engine/components';
import { scenario } from './scenario';
import type { NamedComponentPreview } from './types';

function host(title: string, imports: string, code: string, render: ReactNode, height = 180): NamedComponentPreview {
  return { title, source: `'use client';\n\nimport { ${imports} } from '@nayan-ui/engine/components';\n${code}`, render, host: true, height };
}

function BlurExample({ target }: { target: boolean }) {
  const ref = useRef<E.NBlurTargetRef>(null);
  return (
    <E.NView style={{ position: 'relative', height: 160, overflow: 'hidden', backgroundColor: '#5b21b6' }}>
      {target ? (
        <E.NBlurTarget ref={ref}>
          <E.NText style={{ padding: 20, color: '#fff' }}>Source layer</E.NText>
        </E.NBlurTarget>
      ) : (
        <E.NText style={{ padding: 20, color: '#fff' }}>Sharp background text</E.NText>
      )}
      <E.NBlur
        blurTarget={target ? ref : undefined}
        radius={8}
        tint="light"
        style={{ position: 'absolute', top: 28, left: 12, right: 12, padding: 16, borderRadius: 12 }}
      >
        <E.NText style={{ color: '#171022' }}>Light material</E.NText>
      </E.NBlur>
    </E.NView>
  );
}

function blurScenario(target: boolean) {
  return host(
    target ? 'Separate the sampled layer' : 'Light tint and custom radius',
    target ? 'NBlur, NBlurTarget, NText, NView, type NBlurTargetRef' : 'NBlur, NText, NView',
    `${target ? "import { useRef } from 'react';\n" : ''}
export default function Example() {
  ${target ? 'const target = useRef<NBlurTargetRef>(null);\n  ' : ''}return (
    <NView style={{ position: 'relative', height: 160, overflow: 'hidden', backgroundColor: '#5b21b6' }}>
      ${target ? '<NBlurTarget ref={target}><NText style={{ padding: 20, color: "#fff" }}>Source layer</NText></NBlurTarget>' : '<NText style={{ padding: 20, color: "#fff" }}>Sharp background text</NText>'}
      <NBlur ${target ? 'blurTarget={target} ' : ''}radius={8} tint="light" style={{ position: 'absolute', top: 28, left: 12, right: 12, padding: 16, borderRadius: 12 }}>
        <NText style={{ color: '#171022' }}>Light material</NText>
      </NBlur>
    </NView>
  );
}`,
    <BlurExample target={target} />
  );
}

function DrawerContent() {
  const { close } = E.useNDrawer();
  return (
    <div className="component-host-demo">
      <E.NText>Workspace shortcuts</E.NText>
      <E.NButton className="component-host-button" onPress={close}>
        Done
      </E.NButton>
    </div>
  );
}

function DrawerTrigger({ toggle }: { toggle: boolean }) {
  const drawer = E.useNDrawer();
  return (
    <div className="component-host-demo">
      <E.NButton className="component-host-button" onPress={toggle ? drawer.toggle : drawer.open}>
        {toggle ? 'Toggle shortcuts' : 'Open shortcuts'}
      </E.NButton>
    </div>
  );
}

function drawerScenario(toggle: boolean) {
  return host(
    toggle ? 'Toggle from a toolbar' : 'Right-side drawer',
    'NDrawer, NButton, NText, NView, useNDrawer',
    `
function Shortcuts() {
  const { close } = useNDrawer();
  return <NView><NText>Workspace shortcuts</NText><NButton onPress={close}>Done</NButton></NView>;
}

function Trigger() {
  const drawer = useNDrawer();
  return <NButton onPress={drawer.${toggle ? 'toggle' : 'open'}}>${toggle ? 'Toggle shortcuts' : 'Open shortcuts'}</NButton>;
}

export default function Example() {
  return (
    <NView style={{ height: 220 }}>
      <NDrawer side="right" width={210} drawerContent={<Shortcuts />} drawerStyle={{ backgroundColor: '#ede8fa', color: '#191126' }}>
        <Trigger />
      </NDrawer>
    </NView>
  );
}`,
    <E.NDrawer side="right" width={210} drawerStyle={{ backgroundColor: 'var(--surface)' }} drawerContent={<DrawerContent />}>
      <DrawerTrigger toggle={toggle} />
    </E.NDrawer>,
    220
  );
}

function KeyboardSteps() {
  const keyboard = E.useNKeyboard();
  return (
    <>
      <E.NInput label="First name" />
      <E.NInput label="Last name" />
      <E.NView className="flex-row flex-wrap gap-2">
        <E.NButton onPress={keyboard.focusPrevious}>Previous field</E.NButton>
        <E.NButton onPress={keyboard.focusNext}>Next field</E.NButton>
      </E.NView>
    </>
  );
}

function keyboardScenario(toolbar: boolean) {
  return host(
    toolbar ? 'Custom Done label' : 'Move between fields',
    'NKeyboard, useNKeyboard, NPage, NInput, NButton, NView',
    `
function Fields() {
  const keyboard = useNKeyboard();
  return (
    <>
      <NInput label="First name" />
      <NInput label="Last name" />
      <NView className="flex-row flex-wrap gap-2">
        <NButton onPress={keyboard.focusPrevious}>Previous field</NButton>
        <NButton onPress={keyboard.focusNext}>Next field</NButton>
      </NView>
    </>
  );
}

export default function Example() {
  return <NKeyboard toolbar={${toolbar}} doneLabel="Finish"><NPage className="gap-3 p-4"><Fields /></NPage></NKeyboard>;
}`,
    <E.NKeyboard toolbar={toolbar} doneLabel="Finish">
      <E.NPage className="gap-3 p-4">
        <KeyboardSteps />
      </E.NPage>
    </E.NKeyboard>,
    260
  );
}

function SafeMeasurements({ variant }: { variant: 'frame' | 'insets' }) {
  const frame = E.useNSafeAreaFrame();
  const insets = E.useNSafeAreaInsets();
  const info = variant === 'frame' ? `${Math.round(frame.width)} × ${Math.round(frame.height)} px` : `Bottom inset: ${insets.bottom} px`;
  return (
    <div className="component-host-demo">
      <E.NText>{info}</E.NText>
    </div>
  );
}

function SafeListener() {
  const [width, setWidth] = useState(0);
  return (
    <E.NSafeAreaListener onChange={({ frame }) => setWidth(Math.round(frame.width))}>
      <div className="component-host-demo">
        <E.NText>Available width: {width} px</E.NText>
      </div>
    </E.NSafeAreaListener>
  );
}

function safeHook(variant: 'frame' | 'insets') {
  const hook = variant === 'frame' ? 'useNSafeAreaFrame' : 'useNSafeAreaInsets';
  const text = variant === 'frame' ? '{Math.round(value.width)} × {Math.round(value.height)} px' : 'Bottom inset: {value.bottom} px';
  return host(
    variant === 'frame' ? 'Measure a nested panel' : 'Read only the bottom inset',
    `NSafeAreaProvider, NText, ${hook}`,
    `
function Readout() {
  const value = ${hook}();
  return <NText>${text}</NText>;
}

export default function Example() {
  return <NSafeAreaProvider style={{ height: 120 }}><Readout /></NSafeAreaProvider>;
}`,
    <E.NSafeAreaProvider style={{ height: 120 }}>
      <SafeMeasurements variant={variant} />
    </E.NSafeAreaProvider>
  );
}

function ThemeReadout() {
  const { resolvedTheme, setTheme } = E.useNTheme();
  return (
    <>
      <E.NText>Mode: {resolvedTheme}</E.NText>
      <E.NView className="flex-row flex-wrap gap-2">
        <E.NButton isOutline onPress={() => setTheme('dark')}>
          Dark
        </E.NButton>
        <E.NButton isOutline onPress={() => setTheme('system')}>
          System
        </E.NButton>
      </E.NView>
    </>
  );
}

function ThemeExample() {
  return (
    <E.NTheme defaultTheme="light">
      <E.NPage className="gap-3 p-4">
        <ThemeReadout />
      </E.NPage>
    </E.NTheme>
  );
}

function Confetti() {
  const [run, setRun] = useState(0);
  return (
    <>
      <E.NButton onPress={() => setRun(run + 1)}>Celebrate milestone</E.NButton>
      <E.NConfetti run={run} count={44} className="h-24 w-full" />
    </>
  );
}

function Refresh() {
  const [refreshing, setRefreshing] = useState(false);
  const [updates, setUpdates] = useState(0);
  useEffect(() => {
    if (!refreshing) return;
    const id = setTimeout(() => {
      setUpdates((count) => count + 1);
      setRefreshing(false);
    }, 500);
    return () => clearTimeout(id);
  }, [refreshing]);
  return (
    <E.NScrollView refreshControl={<E.NRefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />}>
      <E.NText>Refreshes: {updates}</E.NText>
      <E.NButton disabled={refreshing} onPress={() => setRefreshing(true)}>
        {refreshing ? 'Refreshing…' : 'Refresh data'}
      </E.NButton>
    </E.NScrollView>
  );
}

const rows = Array.from({ length: 8 }, (_, index) => `Item ${index + 1}`);
const horizontalRow = 'h-20 w-40 rounded-lg border border-border bg-surface p-3';

function HorizontalScroll({ shadow }: { shadow: boolean }) {
  const content = (
    <E.NView className="flex-row gap-2">
      {rows.map((name) => (
        <E.NView className={horizontalRow} key={name}>
          <E.NText>{name}</E.NText>
        </E.NView>
      ))}
    </E.NView>
  );
  return shadow ? (
    <E.NScrollShadow orientation="horizontal" height={108}>
      {content}
    </E.NScrollShadow>
  ) : (
    <E.NScrollView horizontal height={108}>
      {content}
    </E.NScrollView>
  );
}

function scrollScenario(shadow: boolean) {
  const control = shadow ? 'NScrollShadow' : 'NScrollView';
  const prop = shadow ? 'orientation="horizontal"' : 'horizontal';
  return scenario(
    shadow ? 'Horizontal edge hint' : 'Horizontal cards',
    `${control}, NText`,
    `<${control} ${prop} height={108}>
            <NView className="flex-row gap-2">
              {Array.from({ length: 8 }, (_, index) => <NView key={index} className="${horizontalRow}"><NText>Item {index + 1}</NText></NView>)}
            </NView>
          </${control}>`,
    <HorizontalScroll shadow={shadow} />,
    undefined,
    172
  );
}

export const hostScenarios = {
  blur: blurScenario(false),
  'blur-target': blurScenario(true),
  'components-root': host(
    'Own the surface background',
    'ComponentsRoot, NTheme, NText',
    `
export default function Example() {
  return <NTheme><ComponentsRoot background="#281a41" style={{ height: 140 }}><NText style={{ padding: 20, color: '#fff' }}>Custom surface</NText></ComponentsRoot></NTheme>;
}`,
    <E.ComponentsRoot background="#281a41" style={{ height: 140, minHeight: 0, flex: 'none' }}>
      <E.NText style={{ padding: 20, color: '#fff' }}>Custom surface</E.NText>
    </E.ComponentsRoot>
  ),
  confetti: scenario(
    'Celebrate with more particles',
    'NButton, NConfetti',
    `<NButton onPress={() => setRun(run + 1)}>Celebrate milestone</NButton>
          <NConfetti run={run} count={44} className="h-24 w-full" />`,
    <Confetti />,
    'const [run, setRun] = useState(0);',
    210
  ),
  drawer: drawerScenario(false),
  'use-drawer': drawerScenario(true),
  keyboard: keyboardScenario(true),
  'use-keyboard': keyboardScenario(false),
  page: host(
    'Screen with keyboard support',
    'NPage, NInput, NText',
    `
export default function Example() {
  return <NPage keyboard className="gap-3 p-5"><NText>Send a message</NText><NInput label="Message" placeholder="Write a note" /></NPage>;
}`,
    <E.NPage keyboard className="gap-3 p-5">
      <E.NText>Send a message</E.NText>
      <E.NInput label="Message" placeholder="Write a note" />
    </E.NPage>,
    200
  ),
  'platform-view': scenario(
    'Browser-native range control',
    'NPlatformView',
    `<NPlatformView style={{ height: 60 }}>
            <label>Zoom <input type="range" min="75" max="150" defaultValue="100" /></label>
          </NPlatformView>`,
    <E.NPlatformView style={{ height: 60 }}>
      <label className="flex items-center gap-3">
        Zoom <input className="accent-[var(--accent)]" type="range" min="75" max="150" defaultValue="100" />
      </label>
    </E.NPlatformView>
  ),
  'refresh-control': host(
    'Refresh and count updates',
    'NPage, NScrollView, NRefreshControl, NText, NButton',
    `import { useEffect, useState } from 'react';

export default function Example() {
  const [refreshing, setRefreshing] = useState(false);
  const [updates, setUpdates] = useState(0);
  useEffect(() => {
    if (!refreshing) return;
    const id = setTimeout(() => {
      setUpdates((count) => count + 1);
      setRefreshing(false);
    }, 500);
    return () => clearTimeout(id);
  }, [refreshing]);
  return (
    <NPage className="p-5">
      <NScrollView refreshControl={<NRefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />}>
        <NText>Refreshes: {updates}</NText>
        <NButton disabled={refreshing} onPress={() => setRefreshing(true)}>{refreshing ? 'Refreshing…' : 'Refresh data'}</NButton>
      </NScrollView>
    </NPage>
  );
}`,
    <E.NPage className="p-5">
      <Refresh />
    </E.NPage>,
    230
  ),
  'safe-area': host(
    'Protect the bottom edge',
    'NSafeArea, NText',
    `
export default function Example() {
  return <NSafeArea edges={{ bottom: 'maximum' }} style={{ padding: 16 }}><NText>Bottom toolbar spacing</NText></NSafeArea>;
}`,
    <E.NSafeArea edges={{ bottom: 'maximum' }} style={{ padding: 16 }}>
      <E.NText>Bottom toolbar spacing</E.NText>
    </E.NSafeArea>
  ),
  'safe-area-listener': host(
    'Watch available width',
    'NSafeAreaListener, NText',
    `import { useState } from 'react';

export default function Example() {
  const [width, setWidth] = useState(0);
  return <NSafeAreaListener onChange={({ frame }) => setWidth(Math.round(frame.width))}><NText>Available width: {width} px</NText></NSafeAreaListener>;
}`,
    <SafeListener />
  ),
  'safe-area-provider': safeHook('frame'),
  'use-safe-area-frame': safeHook('frame'),
  'use-safe-area-insets': safeHook('insets'),
  'scroll-shadow': scrollScenario(true),
  'scroll-view': scrollScenario(false),
  theme: themeScenario('Scoped light theme'),
  'use-theme': themeScenario('Set an explicit preference'),
  'toast-host': host(
    'Custom toast width',
    'NTheme, NToastHost, NToast, NButton, NView',
    `
export default function Example() {
  return <NTheme toasts={false}><NView><NToastHost top={80} maxWidth={300} /><NButton onPress={() => NToast.success('Synced')}>Show toast</NButton></NView></NTheme>;
}`,
    <div className="component-host-demo">
      <E.NToastHost top={80} maxWidth={300} />
      <E.NButton className="component-host-button" onPress={() => E.NToast.success('Synced')}>
        Show toast
      </E.NButton>
    </div>
  )
};

function themeScenario(title: string) {
  return host(
    title,
    'NTheme, useNTheme, NPage, NButton, NText, NView',
    `
function Picker() {
  const { resolvedTheme, setTheme } = useNTheme();
  return (
    <>
      <NText>Mode: {resolvedTheme}</NText>
      <NView className="flex-row flex-wrap gap-2">
        <NButton isOutline onPress={() => setTheme('dark')}>Dark</NButton>
        <NButton isOutline onPress={() => setTheme('system')}>System</NButton>
      </NView>
    </>
  );
}

export default function Example() {
  return <NTheme defaultTheme="light"><NPage className="gap-3 p-4"><Picker /></NPage></NTheme>;
}`,
    <ThemeExample />
  );
}
