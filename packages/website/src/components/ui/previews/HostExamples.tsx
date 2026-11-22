'use client';

import { PREVIEW_STACK, PREVIEW_BUTTON } from '@/design/system';
import { useEffect, useState, type ComponentType } from 'react';
import {
  NBlur,
  NButton,
  NCard,
  NConfetti,
  NInput,
  NKeyboard,
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
  NDrawer
} from 'nayan-ui/components';
import { standaloneExamples } from '@/services/nayan-ui/component-examples';
import type { ComponentPreview } from './types';

function Blur() {
  const [enabled, setEnabled] = useState(true);
  const background = <NText className="[color:#fde68a] text-[26px] font-bold">Colour and texture</NText>;
  return (
    <NView tag="div" className={PREVIEW_STACK}>
      <NView tag="div" className="component-blur-scene relative grid w-full [min-height:9rem] [place-items:center] overflow-hidden [border-radius:0.75rem] [background:repeating-linear-gradient(135deg,_#432079_0_12px,_#7649c2_12px_24px)]">
        {background}
        <NBlur intensity={56} enabled={enabled} tint="dark" className="component-blur-panel absolute [inset:25%_12%] grid [place-items:center] [border:1px_solid_#ffffff66] [border-radius:0.75rem] [background:#24104455]">
          <NText className="text-white">Sharp foreground</NText>
        </NBlur>
      </NView>
      <NButton className={PREVIEW_BUTTON} onPress={() => setEnabled(!enabled)}>
        {enabled ? 'Turn blur off' : 'Turn blur on'}
      </NButton>
    </NView>
  );
}

function ConfettiDemo() {
  const [run, setRun] = useState(0);
  return (
    <NView className="items-start gap-3 h-[200px]">
      <NButton onPress={() => setRun((value) => value + 1)}>Celebrate</NButton>
      <NConfetti run={run} count={24} className="w-full h-[140px]" />
    </NView>
  );
}

function DrawerButton({ dismiss = false }: { dismiss?: boolean }) {
  const { open, close } = useNDrawer();
  return (
    <NButton className={PREVIEW_BUTTON} onPress={dismiss ? close : open}>
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
        <NView tag="div" className={PREVIEW_STACK}>
          <NText tag="p" className="text-sm font-semibold">
            Navigation
          </NText>
          <DrawerButton dismiss />
        </NView>
      }
    >
      <NView tag="div" className={PREVIEW_STACK}>
        <DrawerButton />
      </NView>
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
      <NTheme className="gap-3 p-4">
        <NInput label="Name" placeholder="Ada" />
        <NInput label="Email" type="email" placeholder="ada@example.com" />
        <KeyboardStatus />
      </NTheme>
    </NKeyboard>
  );
}

function PlatformDemo() {
  const [count, setCount] = useState(0);
  return (
    <NPlatformView className="h-[62px]">
      <NButton className={PREVIEW_BUTTON} onPress={() => setCount((value) => value + 1)}>
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
      <NSafeArea mode="padding" className={PREVIEW_STACK}>
        <NText tag="p">Content inside the safe area</NText>
        <SafeAreaInsets />
      </NSafeArea>
    </NSafeAreaProvider>
  );
}

function SafeAreaMeasurements() {
  const { width, height } = useNSafeAreaFrame();
  return (
    <NView tag="div" className={PREVIEW_STACK}>
      <NText tag="p">
        Frame {Math.round(width)} × {Math.round(height)}
      </NText>
      <SafeAreaInsets />
    </NView>
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
      <NView tag="div" className={PREVIEW_STACK}>
        <NText tag="p" aria-live="polite">
          {frame}
        </NText>
        <NText tag="p">Resize the viewport to update the measurement.</NText>
      </NView>
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
    <NTheme defaultTheme="system" className="bg-background p-4" surface={{ style: { height: 180 } }}>
      <ThemeControls />
    </NTheme>
  );
}

function ToastHostDemo() {
  return (
    <NView tag="div" className={PREVIEW_STACK}>
      <NButton className={PREVIEW_BUTTON} onPress={() => NToast.success('Changes saved')}>
        Show toast
      </NButton>
      <NToastHost top={76} />
    </NView>
  );
}

const hosts: Record<string, { demo: ComponentType; host?: boolean; height?: number }> = {
  blur: { demo: Blur, host: true },
  confetti: { demo: ConfettiDemo, height: 246 },
  drawer: { demo: DrawerDemo, host: true },
  keyboard: { demo: KeyboardDemo, host: true, height: 278 },
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
