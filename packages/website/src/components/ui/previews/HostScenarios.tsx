import { PREVIEW_STACK, PREVIEW_BUTTON } from '@/design/system';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as E from 'nayan-ui/components';
import { scenario } from './scenario';
import type { NamedComponentPreview } from './types';

function host(title: string, imports: string, code: string, render: ReactNode, height?: number): NamedComponentPreview {
  return { title, source: `'use client';\n\nimport { ${imports} } from 'nayan-ui/components';\n${code}`, render, host: true, height };
}

function BlurExample() {
  const ref = useRef<E.NViewNativeRef>(null);
  return (
    <E.NPlatformView className="h-40">
      <E.NView className="relative h-40 overflow-hidden bg-[#5b21b6]">
        <E.NView ref={ref} collapsable={false} className="flex-1 flex-row items-center justify-evenly gap-3 p-5" accessibilityLabel="Source layer">
          <E.NView className="h-20 w-12 rounded-lg bg-amber-300" />
          <E.NView className="h-20 w-12 rounded-lg bg-sky-300" />
        </E.NView>
        <E.NBlur blurTarget={ref} radius={8} tint="light" className="absolute top-7 inset-x-3 h-24 rounded-xl" accessibilityLabel="Blurred overlay" />
      </E.NView>
    </E.NPlatformView>
  );
}

function blurScenario() {
  return host(
    'Android source view',
    'NBlur, NPlatformView, NView, type NViewNativeRef',
    `import { useRef } from 'react';

export default function Example() {
  const target = useRef<NViewNativeRef>(null);
  return (
    <NPlatformView className="h-40">
      <NView className="relative h-40 overflow-hidden bg-[#5b21b6]">
        <NView ref={target} collapsable={false} className="flex-1 flex-row items-center justify-evenly gap-3 p-5" accessibilityLabel="Source layer">
          <NView className="h-20 w-12 rounded-lg bg-amber-300" />
          <NView className="h-20 w-12 rounded-lg bg-sky-300" />
        </NView>
        <NBlur blurTarget={target} radius={8} tint="light" className="absolute top-7 inset-x-3 h-24 rounded-xl" accessibilityLabel="Blurred overlay" />
      </NView>
    </NPlatformView>
  );
}`,
    <BlurExample />
  );
}

function DrawerContent() {
  const { close } = E.useNDrawer();
  return (
    <E.NView tag="div" className={PREVIEW_STACK}>
      <E.NText>Workspace shortcuts</E.NText>
      <E.NButton className={PREVIEW_BUTTON} onPress={close}>
        Done
      </E.NButton>
    </E.NView>
  );
}

function DrawerTrigger({ toggle }: { toggle: boolean }) {
  const drawer = E.useNDrawer();
  return (
    <E.NView tag="div" className={PREVIEW_STACK}>
      <E.NButton className={PREVIEW_BUTTON} onPress={toggle ? drawer.toggle : drawer.open}>
        {toggle ? 'Toggle shortcuts' : 'Open shortcuts'}
      </E.NButton>
    </E.NView>
  );
}

const drawerStyle = { backgroundColor: 'var(--overlay)', color: 'var(--overlay-foreground)' };

function drawerScenario(toggle: boolean) {
  return host(
    toggle ? 'Toggle from a toolbar' : 'Right-side drawer',
    'NDrawer, NButton, NText, NView, useNDrawer',
    `
function Shortcuts() {
  const { close } = useNDrawer();
  return <NView className="${PREVIEW_STACK}"><NText>Workspace shortcuts</NText><NButton className="${PREVIEW_BUTTON}" onPress={close}>Done</NButton></NView>;
}

function Trigger() {
  const drawer = useNDrawer();
  return (
    <NView className="${PREVIEW_STACK}">
      <NButton className="${PREVIEW_BUTTON}" onPress={drawer.${toggle ? 'toggle' : 'open'}}>${toggle ? 'Toggle shortcuts' : 'Open shortcuts'}</NButton>
    </NView>
  );
}

export default function Example() {
  return (
    <NView className="h-[220px]">
      <NDrawer side="right" width={210} drawerContent={<Shortcuts />} drawerStyle={${JSON.stringify(drawerStyle)}}>
        <Trigger />
      </NDrawer>
    </NView>
  );
}`,
    <E.NDrawer side="right" width={210} drawerStyle={drawerStyle} drawerContent={<DrawerContent />}>
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
    'NKeyboard, useNKeyboard, NTheme, NInput, NButton, NView',
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
  return <NKeyboard toolbar={${toolbar}} doneLabel="Finish"><NTheme className="gap-3 p-4"><Fields /></NTheme></NKeyboard>;
}`,
    <E.NKeyboard toolbar={toolbar} doneLabel="Finish">
      <E.NTheme className="gap-3 p-4">
        <KeyboardSteps />
      </E.NTheme>
    </E.NKeyboard>,
    260
  );
}

function SafeMeasurements({ variant }: { variant: 'frame' | 'insets' }) {
  const frame = E.useNSafeAreaFrame();
  const insets = E.useNSafeAreaInsets();
  const info = variant === 'frame' ? `${Math.round(frame.width)} × ${Math.round(frame.height)} px` : `Bottom inset: ${insets.bottom} px`;
  return (
    <E.NView tag="div" className={PREVIEW_STACK}>
      <E.NText>{info}</E.NText>
    </E.NView>
  );
}

function SafeListener() {
  const [width, setWidth] = useState(0);
  return (
    <E.NSafeAreaListener onChange={({ frame }) => setWidth(Math.round(frame.width))}>
      <E.NView tag="div" className={PREVIEW_STACK}>
        <E.NText>Available width: {width} px</E.NText>
      </E.NView>
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

const scopedThemePage = 'gap-3 bg-background p-4';

function ThemeExample() {
  return (
    <E.NTheme defaultTheme="light" className={scopedThemePage} surface={{ style: { height: 180 } }}>
      <ThemeReadout />
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
  blur: blurScenario(),
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
  'platform-view': scenario(
    'Browser-native range control',
    'NPlatformView, NText',
    `<NPlatformView className="h-[60px]">
            <NView tag="label" className="flex items-center gap-3">
              <NText>Zoom</NText>
              <NView tag="input" className="accent-[var(--accent)]" type="range" min={75} max={150} defaultValue={100} />
            </NView>
          </NPlatformView>`,
    <E.NPlatformView className="h-[60px]">
      <E.NView tag="label" className="flex items-center gap-3">
        <E.NText>Zoom</E.NText>
        <E.NView tag="input" className="accent-[var(--accent)]" type="range" min={75} max={150} defaultValue={100} />
      </E.NView>
    </E.NPlatformView>
  ),
  'refresh-control': host(
    'Refresh and count updates',
    'NTheme, NScrollView, NRefreshControl, NText, NButton',
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
    <NTheme className="p-5">
      <NScrollView refreshControl={<NRefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />}>
        <NText>Refreshes: {updates}</NText>
        <NButton disabled={refreshing} onPress={() => setRefreshing(true)}>{refreshing ? 'Refreshing…' : 'Refresh data'}</NButton>
      </NScrollView>
    </NTheme>
  );
}`,
    <E.NTheme className="p-5">
      <Refresh />
    </E.NTheme>,
    230
  ),
  'safe-area': host(
    'Protect the bottom edge',
    'NSafeArea, NText',
    `
export default function Example() {
  return <NSafeArea edges={{ bottom: 'maximum' }} className="p-[16px]"><NText>Bottom toolbar spacing</NText></NSafeArea>;
}`,
    <E.NSafeArea edges={{ bottom: 'maximum' }} className="p-[16px]">
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
  return <NTheme toasts={false}><NView className="${PREVIEW_STACK}"><NToastHost top={80} maxWidth={300} /><NButton className="${PREVIEW_BUTTON}" onPress={() => NToast.success('Synced')}>Show toast</NButton></NView></NTheme>;
}`,
    <E.NView tag="div" className={PREVIEW_STACK}>
      <E.NToastHost top={80} maxWidth={300} />
      <E.NButton className={PREVIEW_BUTTON} onPress={() => E.NToast.success('Synced')}>
        Show toast
      </E.NButton>
    </E.NView>
  )
};

function themeScenario(title: string) {
  return host(
    title,
    'NTheme, useNTheme, NButton, NText, NView',
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
  return <NTheme defaultTheme="light" className="${scopedThemePage}" surface={{ style: { height: 180 } }}><Picker /></NTheme>;
}`,
    <ThemeExample />
  );
}
