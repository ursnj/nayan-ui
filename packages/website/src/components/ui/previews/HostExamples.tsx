'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  ComponentsRoot,
  NBlur,
  NBlurTarget,
  NButton,
  NCard,
  NConfetti,
  NInput,
  NKeyboard,
  NPage,
  NPlatformView,
  NRefreshControl,
  NSafeArea,
  NSafeAreaListener,
  NSafeAreaProvider,
  NScrollView,
  NText,
  NTheme,
  NToast,
  NToastHost,
  NView,
  useNDrawer,
  useNKeyboard,
  useNSafeAreaFrame,
  useNSafeAreaInsets,
  useNTheme,
  NDrawer,
  type NBlurTargetRef
} from '@nayan-ui/engine/components';
import { standaloneExamples } from '@/services/engine/component-examples';
import type { ComponentPreview } from './types';

function Blur({ sampleTarget = false }: { sampleTarget?: boolean }) {
  const target = useRef<NBlurTargetRef>(null);
  const [enabled, setEnabled] = useState(true);
  const background = <NText style={{ color: '#fde68a', fontSize: 26, fontWeight: '700' }}>Colour and texture</NText>;
  return (
    <div className="component-host-demo">
      <div className="component-blur-scene">
        {sampleTarget ? <NBlurTarget ref={target}>{background}</NBlurTarget> : background}
        <NBlur blurTarget={sampleTarget ? target : undefined} intensity={56} enabled={enabled} tint="dark" className="component-blur-panel">
          <NText style={{ color: 'white' }}>Sharp foreground</NText>
        </NBlur>
      </div>
      <NButton className="component-host-button" onPress={() => setEnabled(!enabled)}>
        {enabled ? 'Turn blur off' : 'Turn blur on'}
      </NButton>
    </div>
  );
}

function CounterContent() {
  const [count, setCount] = useState(0);
  return (
    <NView className="gap-3 p-4">
      <NText>Pressed {count} times</NText>
      <NButton onPress={() => setCount((value) => value + 1)}>Continue</NButton>
    </NView>
  );
}

function RootDemo() {
  return (
    <ComponentsRoot background="transparent" style={{ flex: 1, minHeight: 0 }}>
      <CounterContent />
    </ComponentsRoot>
  );
}

function PageDemo() {
  return (
    <NPage>
      <CounterContent />
    </NPage>
  );
}

function ConfettiDemo() {
  const [run, setRun] = useState(0);
  return (
    <NView style={{ height: 200 }} className="items-start gap-3">
      <NButton onPress={() => setRun((value) => value + 1)}>Celebrate</NButton>
      <NConfetti run={run} count={24} className="w-full" style={{ height: 140 }} />
    </NView>
  );
}

function DrawerButton({ dismiss = false }: { dismiss?: boolean }) {
  const { open, close } = useNDrawer();
  return (
    <NButton className="component-host-button" onPress={dismiss ? close : open}>
      {dismiss ? 'Close drawer' : 'Open drawer'}
    </NButton>
  );
}

function DrawerDemo() {
  return (
    <NDrawer
      width={240}
      accessibilityLabel="Example navigation drawer"
      drawerStyle={{ backgroundColor: 'var(--overlay)', borderRight: '1px solid var(--border)' }}
      drawerContent={
        <div className="component-host-demo">
          <NText tag="p" className="text-sm font-semibold">
            Navigation
          </NText>
          <DrawerButton dismiss />
        </div>
      }
    >
      <div className="component-host-demo">
        <DrawerButton />
      </div>
    </NDrawer>
  );
}

function KeyboardStatus() {
  const keyboard = useNKeyboard();
  return (
    <>
      <NText>
        {keyboard.visible ? `Keyboard open · ${Math.round(keyboard.height)} px` : keyboard.focusedInput ? 'Editing a field' : 'Keyboard closed'}
      </NText>
      <NButton onPress={keyboard.dismiss}>Done</NButton>
    </>
  );
}

function KeyboardDemo() {
  return (
    <NKeyboard>
      <NPage className="gap-3 p-4">
        <NInput label="Name" placeholder="Ada" />
        <NInput label="Email" type="email" placeholder="ada@example.com" />
        <KeyboardStatus />
      </NPage>
    </NKeyboard>
  );
}

function PlatformDemo() {
  const [count, setCount] = useState(0);
  return (
    <NPlatformView style={{ height: 62 }}>
      <NButton className="component-host-button" onPress={() => setCount((value) => value + 1)}>
        Platform presses: {count}
      </NButton>
    </NPlatformView>
  );
}

function RefreshDemo() {
  const [refreshing, setRefreshing] = useState(false);
  const [updates, setUpdates] = useState(0);
  useEffect(() => {
    if (!refreshing) return;
    const timer = setTimeout(() => {
      setUpdates((value) => value + 1);
      setRefreshing(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [refreshing]);

  function refresh() {
    setRefreshing(true);
  }

  return (
    <NScrollView refreshControl={<NRefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <NView className="gap-3 p-3">
        <NText>{refreshing ? 'Refreshing…' : `Refresh complete: ${updates}`}</NText>
        <NButton onPress={refresh} disabled={refreshing}>
          Refresh
        </NButton>
      </NView>
    </NScrollView>
  );
}

function SafeAreaInsets() {
  const { top, bottom, left, right } = useNSafeAreaInsets();
  return (
    <NText tag="p">
      Top {top} · Right {right} · Bottom {bottom} · Left {left}
    </NText>
  );
}

function SafeAreaDemo() {
  return (
    <NSafeAreaProvider>
      <NSafeArea mode="padding" className="component-host-demo">
        <NText tag="p">Content inside the safe area</NText>
        <SafeAreaInsets />
      </NSafeArea>
    </NSafeAreaProvider>
  );
}

function SafeAreaMeasurements() {
  const { width, height } = useNSafeAreaFrame();
  return (
    <div className="component-host-demo">
      <NText tag="p">
        Frame {Math.round(width)} × {Math.round(height)}
      </NText>
      <SafeAreaInsets />
    </div>
  );
}

function SafeAreaFrameDemo() {
  return (
    <NSafeAreaProvider>
      <SafeAreaMeasurements />
    </NSafeAreaProvider>
  );
}

function SafeAreaListenerDemo() {
  const [frame, setFrame] = useState('Measuring the preview…');
  return (
    <NSafeAreaListener onChange={({ frame }) => setFrame(`Observed ${Math.round(frame.width)} × ${Math.round(frame.height)}`)}>
      <div className="component-host-demo">
        <NText tag="p" aria-live="polite">
          {frame}
        </NText>
        <NText tag="p">Resize the viewport to update the measurement.</NText>
      </div>
    </NSafeAreaListener>
  );
}

const rows = Array.from({ length: 18 }, (_, index) => `Item ${index + 1}`);

function ScrollDemo() {
  return (
    <NScrollView>
      {rows.map((row) => (
        <NText key={row} className="border-b border-border py-2">
          {row}
        </NText>
      ))}
    </NScrollView>
  );
}

function ThemeControls() {
  const { resolvedTheme, toggleTheme } = useNTheme();
  return (
    <NCard className="gap-3 border border-border bg-surface p-4">
      <NText className="text-foreground">Preview theme: {resolvedTheme}</NText>
      <NButton onPress={toggleTheme}>Switch preview theme</NButton>
    </NCard>
  );
}

function ThemeDemo() {
  return (
    <NTheme defaultTheme="system">
      <NPage className="p-4">
        <ThemeControls />
      </NPage>
    </NTheme>
  );
}

function ToastHostDemo() {
  return (
    <div className="component-host-demo">
      <NButton className="component-host-button" onPress={() => NToast.success('Changes saved')}>
        Show toast
      </NButton>
      <NToastHost top={76} />
    </div>
  );
}

const hosts: Record<string, { demo: ComponentType; host?: boolean; height?: number }> = {
  blur: { demo: Blur, host: true },
  'blur-target': { demo: () => <Blur sampleTarget />, host: true },
  'components-root': { demo: RootDemo, host: true },
  confetti: { demo: ConfettiDemo, height: 246 },
  drawer: { demo: DrawerDemo, host: true },
  keyboard: { demo: KeyboardDemo, host: true, height: 278 },
  page: { demo: PageDemo, host: true },
  'platform-view': { demo: PlatformDemo },
  'refresh-control': { demo: RefreshDemo },
  'safe-area': { demo: SafeAreaDemo, host: true },
  'safe-area-listener': { demo: SafeAreaListenerDemo, host: true },
  'safe-area-provider': { demo: SafeAreaFrameDemo, host: true },
  'scroll-view': { demo: ScrollDemo },
  theme: { demo: ThemeDemo, host: true },
  'toast-host': { demo: ToastHostDemo, host: true },
  'use-drawer': { demo: DrawerDemo, host: true },
  'use-keyboard': { demo: KeyboardDemo, host: true, height: 278 },
  'use-safe-area-frame': { demo: SafeAreaFrameDemo, host: true },
  'use-safe-area-insets': { demo: SafeAreaDemo, host: true },
  'use-theme': { demo: ThemeDemo, host: true }
};

export function hostExample(slug: string): ComponentPreview | undefined {
  if (!Object.hasOwn(hosts, slug)) return;
  const { demo: Demo, host, height } = hosts[slug]!;
  const { code, note } = standaloneExamples[slug]!;
  return { render: <Demo />, source: code, note, host, height };
}
