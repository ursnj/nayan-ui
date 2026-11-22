import { PREVIEW_STACK, PREVIEW_BUTTON } from '@/design/system';
export function componentSource(imports: string, body: string, state = '', height = 280, pageClassName = 'gap-4 p-5') {
  const controls = imports.split(', ');
  // Popups are drawn inside the page surface and need room outside the trigger.
  const fitContent = !controls.some((name) => ['NDatePicker', 'NSelect', 'NTooltip', 'NScrollView'].includes(name));
  const names = [...new Set([...controls, 'NPage', 'NTheme', 'NView'])].join(', ');
  return `'use client';

import { ${names} } from 'nayan-ui/components';
${state || fitContent ? "import { useState } from 'react';\n" : ''}
export default function Example() {
${state ? `  ${state}\n` : ''}${fitContent ? `  const [previewHeight, setPreviewHeight] = useState(${height});\n` : ''}  return (
    <NTheme>
      <NView className="flex flex-col" style={{ height: ${fitContent ? 'previewHeight' : height} }}>
        <NPage className="${pageClassName}" safeArea={false}${fitContent ? ' onContentSizeChange={(_, height) => setPreviewHeight(Math.ceil(height))}' : ''}>
          ${body}
        </NPage>
      </NView>
    </NTheme>
  );
}`;
}

const counterCode = `function Counter() {
  const [count, setCount] = useState(0);
  return (
    <NView className="gap-3 p-4">
      <NText>Pressed {count} times</NText>
      <NButton onPress={() => setCount((value) => value + 1)}>Continue</NButton>
    </NView>
  );
}`;

const drawerCode = `import { NButton, NDrawer, NText, NView, useNDrawer } from 'nayan-ui/components';

function DrawerButton({ dismiss = false }: { dismiss?: boolean }) {
  const { open, close } = useNDrawer();
  return <NButton className="${PREVIEW_BUTTON}" onPress={dismiss ? close : open}>{dismiss ? 'Close drawer' : 'Open drawer'}</NButton>;
}

export default function Example() {
  return (
    <NDrawer width={240} accessibilityLabel="Example navigation drawer"
      drawerStyle={{ backgroundColor: 'var(--overlay)', borderRight: '1px solid var(--border)' }}
      drawerContent={<NView className="${PREVIEW_STACK}"><NText className="text-sm font-semibold">Navigation</NText><DrawerButton dismiss /></NView>}>
      <NView className="${PREVIEW_STACK}"><DrawerButton /></NView>
    </NDrawer>
  );
}`;

const keyboardCode = `import { NButton, NInput, NKeyboard, NPage, NText, NView, useNKeyboard } from 'nayan-ui/components';

function KeyboardStatus() {
  const keyboard = useNKeyboard();
  return (
    <>
      <NText>{keyboard.visible ? \`Keyboard open · \${Math.round(keyboard.height)} px\` : keyboard.focusedInput ? 'Editing a field' : 'Keyboard closed'}</NText>
      <NButton onPress={keyboard.dismiss}>Done</NButton>
    </>
  );
}

export default function Example() {
  return (
    <NView className="h-[278px]">
      <NKeyboard>
        <NPage className="gap-3 p-4">
          <NInput label="Name" placeholder="Ada" />
          <NInput label="Email" type="email" placeholder="ada@example.com" />
          <KeyboardStatus />
        </NPage>
      </NKeyboard>
    </NView>
  );
}`;

const themeCode = `import { NButton, NCard, NPage, NText, NTheme, useNTheme } from 'nayan-ui/components';

function ThemeControls() {
  const { resolvedTheme, toggleTheme } = useNTheme();
  return (
    <NCard className="gap-3 border border-border bg-surface p-4">
      <NText className="text-foreground">Preview theme: {resolvedTheme}</NText>
      <NButton onPress={toggleTheme}>Switch preview theme</NButton>
    </NCard>
  );
}

export default function Example() {
  return <NTheme defaultTheme="system"><NPage className="bg-background p-4"><ThemeControls /></NPage></NTheme>;
}`;

function blurCode(target: boolean) {
  return `import { ${target ? 'useRef, ' : ''}useState } from 'react';
import { NBlur, ${target ? 'NBlurTarget, type NBlurTargetRef, ' : ''}NButton, NText, NView } from 'nayan-ui/components';

export default function Example() {
  ${target ? 'const target = useRef<NBlurTargetRef>(null);\n  ' : ''}const [enabled, setEnabled] = useState(true);
  const background = <NText className="[color:#fde68a] text-[26px] font-bold">Colour and texture</NText>;
  return (
    <NView className="${PREVIEW_STACK}">
      <NView className="component-blur-scene relative grid w-full [min-height:9rem] [place-items:center] overflow-hidden [border-radius:0.75rem] [background:repeating-linear-gradient(135deg,_#432079_0_12px,_#7649c2_12px_24px)]">
        ${target ? '<NBlurTarget ref={target}>{background}</NBlurTarget>' : '{background}'}
        <NBlur ${target ? 'blurTarget={target} ' : ''}intensity={56} enabled={enabled} tint="dark" className="component-blur-panel absolute [inset:25%_12%] grid [place-items:center] [border:1px_solid_#ffffff66] [border-radius:0.75rem] [background:#24104455]">
          <NText className="text-white">Sharp foreground</NText>
        </NBlur>
      </NView>
      <NButton className="${PREVIEW_BUTTON}" onPress={() => setEnabled(!enabled)}>
        {enabled ? 'Turn blur off' : 'Turn blur on'}
      </NButton>
    </NView>
  );
}`;
}

export const standaloneExamples: Record<string, { code: string; note?: string }> = {
  'animation-view': {
    code: `'use client';

import { useState } from 'react';
import { AnimationView, useAnimatedStyle, useSharedValue, withTiming } from 'nayan-ui/animations';
import { NButton, NText, NView } from 'nayan-ui/components';

export default function Example() {
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle({ opacity });
  const [faded, setFaded] = useState(false);
  return (
    <NView className="${PREVIEW_STACK}">
      <AnimationView animatedStyle={style} className="component-animation-block [border-radius:0.75rem] [border:1px_solid_color-mix(in_srgb,_var(--accent)_22%,_var(--surface))] [background:color-mix(in_srgb,_var(--accent)_12%,_var(--surface))] text-foreground [padding:1.5rem]"><NText>Animated view</NText></AnimationView>
      <NButton className="${PREVIEW_BUTTON}" onPress={() => {
        opacity.value = withTiming(faded ? 1 : 0.4);
        setFaded(!faded);
      }}>{faded ? 'Fade in' : 'Fade out'}</NButton>
    </NView>
  );
}`
  },
  blur: {
    note: 'Blur depends on platform support. For a native view target, pass the ref from NBlurTarget as blurTarget.',
    code: blurCode(false)
  },
  'blur-target': {
    code: blurCode(true)
  },
  'components-root': {
    note: 'Mount a root per rendering surface. Pass a stylesheet generated by the Styles Compiler when using custom utilities.',
    code: `import { useState } from 'react';
import { ComponentsRoot, NButton, NText, NView } from 'nayan-ui/components';

${counterCode}

export default function Example() {
  return (
    <ComponentsRoot style={{ flex: 1, minHeight: 0 }} background="transparent"><Counter /></ComponentsRoot>
  );
}`
  },
  confetti: {
    code: componentSource(
      'NButton, NConfetti',
      `<NView className="items-start gap-3 h-[200px]">
            <NButton onPress={() => setRun((value) => value + 1)}>Celebrate</NButton>
            <NConfetti run={run} count={24} className="w-full h-[140px]" />
          </NView>`,
      'const [run, setRun] = useState(0);'
    )
  },
  drawer: {
    note: 'Mount NDrawer outside ComponentsRoot. The open state can be controlled by the screen or by useNDrawer.',
    code: drawerCode
  },
  'drawing-canvas': {
    code: `'use client';

import { useEffect, useState } from 'react';
import { DrawingCanvas, DrawingDocument } from 'nayan-ui/drawing';
import { warmUpEngine } from 'nayan-ui/games';
import { NButton, NLoading, NText, NView } from 'nayan-ui/components';

export default function Example() {
  const [document, setDocument] = useState<DrawingDocument>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let drawing: DrawingDocument | undefined;
    void warmUpEngine().then(() => {
      if (!active) return;
      drawing = new DrawingDocument(320, 240);
      drawing.setBrush({ brushType: 'MARKER', color: '#1864e8', width: 8, opacity: 1 });
      setDocument(drawing);
    }).catch((cause: unknown) => {
      if (active) setError(String(cause));
    });
    return () => { active = false; drawing?.dispose(); };
  }, []);
  if (error) return <NText>{error}</NText>;
  if (!document) return <NLoading label="Preparing drawing canvas" />;
  return (
    <NView className="${PREVIEW_STACK}">
      <NText tag="p">Draw on the canvas.</NText>
      <NView className="component-media-surface w-full [height:206px] [flex:none] overflow-hidden [border:1px_solid_var(--border)] [border-radius:0.75rem]">
        <DrawingCanvas document={document} mode="draw" />
      </NView>
      <NButton className="${PREVIEW_BUTTON}" onPress={() => document.clear()}>Clear drawing</NButton>
    </NView>
  );
}`
  },
  'game-view': {
    code: `'use client';

import { useRef, useState } from 'react';
import { GameView, useWorld, type Camera, type Entity } from 'nayan-ui/games';
import { NButton, NLoading, NText, NView } from 'nayan-ui/components';

export default function Example() {
  const cube = useRef<Entity | null>(null);
  const camera: Camera = { eye: [3, 2, 4], target: [0, 0, 0], fov: 0.65, ortho: 1.25 };
  const [alternate, setAlternate] = useState(false);
  const [error, setError] = useState('');
  const world = useWorld(32, (world) => {
    cube.current = world.spawn({ mesh: 'cube', color: '#699cff' });
  }, [], (cause) => setError(cause.message));
  if (error) return <NText tag="p" role="status" className="${PREVIEW_STACK}">{error}</NText>;
  if (!world) return <NLoading label="Preparing scene" />;
  return (
    <NView className="${PREVIEW_STACK}">
      <NView className="component-media-surface w-full [height:206px] [flex:none] overflow-hidden [border:1px_solid_var(--border)] [border-radius:0.75rem]">
        <GameView source={world} camera={camera} style={{ width: '100%', height: '100%' }} onError={(cause) => setError(cause.message)} />
      </NView>
      <NButton className="${PREVIEW_BUTTON}" onPress={() => {
        if (cube.current === null) return;
        world.set(cube.current, { color: alternate ? '#699cff' : '#48d9a5' });
        setAlternate(!alternate);
      }}>{alternate ? 'Show blue cube' : 'Show green cube'}</NButton>
    </NView>
  );
}`
  },
  joystick: {
    note: 'Read the mutable stick coordinates inside the game loop. Both axes range from −1 to 1.',
    code: `'use client';

import { useEffect, useState } from 'react';
import { Joystick, useJoystick } from 'nayan-ui/games';
import { NText, NView } from 'nayan-ui/components';

export default function Controls() {
  const stick = useJoystick();
  const [position, setPosition] = useState('0.00, 0.00');

  useEffect(() => {
    let frame: number;
    function sample() {
      setPosition(stick.x.toFixed(2) + ', ' + stick.y.toFixed(2));
      frame = requestAnimationFrame(sample);
    }
    frame = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(frame);
  }, [stick]);

  return (
    <NView className="${PREVIEW_STACK}">
      <Joystick state={stick} size={120} style={{ background: '#2e1853', borderColor: '#8655d8' }} />
      <NText tag="p">X, Y: {position}</NText>
    </NView>
  );
}`
  },
  keyboard: {
    note: 'Use NKeyboard around an engine form on devices with a software keyboard.',
    code: keyboardCode
  },
  'markdown-view': {
    code: `'use client';

import { NPage } from 'nayan-ui/components';
import { NMarkdown } from 'nayan-ui/markdown';

export default function Example() {
  const source = '## Release notes\\n\\nThis preview renders **Markdown** with engine components.\\n\\n- Interfaces for the web and native\\n- Inline code like \`useWorld\`';
  return (
    <NPage className="p-4">
      <NMarkdown source={source} blockSpacing={12} />
    </NPage>
  );
}`
  },
  page: {
    code: `import { useState } from 'react';
import { NButton, NPage, NText, NView } from 'nayan-ui/components';

${counterCode}

export default function Example() {
  return <NPage><Counter /></NPage>;
}`
  },
  'platform-view': {
    note: 'The child is rendered by the host platform. Supply a web element on React or a React Native view on native.',
    code: componentSource(
      'NPlatformView, NButton',
      `<NPlatformView className="h-[62px]">
            <NButton className="${PREVIEW_BUTTON}" onPress={() => setCount((value) => value + 1)}>Platform presses: {count}</NButton>
          </NPlatformView>`,
      'const [count, setCount] = useState(0);'
    )
  },
  'refresh-control': {
    code: componentSource(
      'NRefreshControl, NScrollView, NText, NButton',
      `<NScrollView refreshControl={<NRefreshControl refreshing={refreshing} onRefresh={refresh} />}>
            <NView className="gap-3 p-3">
              <NText>{refreshing ? 'Refreshing…' : \`Refresh complete: \${updates}\`}</NText>
              <NButton onPress={refresh} disabled={refreshing}>Refresh</NButton>
            </NView>
          </NScrollView>`,
      `const [refreshing, setRefreshing] = useState(false);
  const [updates, setUpdates] = useState(0);
  function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => { setUpdates((value) => value + 1); setRefreshing(false); }, 450);
  }`,
      246
    )
  },
  'safe-area': {
    code: `import { NSafeArea, NSafeAreaProvider, NText } from 'nayan-ui/components';

export default function Example() {
  return (
    <NSafeAreaProvider>
      <NSafeArea edges={['top', 'bottom']}>
        <NText>Content inside the safe area</NText>
      </NSafeArea>
    </NSafeAreaProvider>
  );
}`
  },
  'safe-area-provider': {
    code: `import { NSafeAreaProvider, NText, useNSafeAreaInsets } from 'nayan-ui/components';

function Insets() {
  const { top } = useNSafeAreaInsets();
  return <NText>Top inset {top}</NText>;
}

export default function Example() {
  return <NSafeAreaProvider><Insets /></NSafeAreaProvider>;
}`
  },
  'safe-area-listener': {
    code: `import { NSafeAreaListener, NText } from 'nayan-ui/components';

export default function Example() {
  return (
    <NSafeAreaListener onChange={({ insets }) => console.log(insets)}>
      <NText>Watch for inset changes</NText>
    </NSafeAreaListener>
  );
}`
  },
  'scroll-view': {
    code: componentSource(
      'NScrollView, NText',
      `<NScrollView>
            {Array.from({ length: 18 }, (_, index) => <NText key={index} className="border-b border-border py-2">Item {index + 1}</NText>)}
          </NScrollView>`,
      '',
      246
    )
  },
  theme: {
    code: themeCode
  },
  'toast-host': {
    note: 'Mount a host once near the root of the app, then enqueue toasts from user actions.',
    code: `import { NButton, NToast, NToastHost, NView } from 'nayan-ui/components';

export default function Example() {
  return (
    <NView className="${PREVIEW_STACK}">
      <NButton className="${PREVIEW_BUTTON}" onPress={() => NToast.success('Changes saved')}>Show toast</NButton>
      <NToastHost top={76} />
    </NView>
  );
}`
  },
  'use-drawer': {
    code: drawerCode
  },
  'use-keyboard': {
    code: keyboardCode
  },
  'use-safe-area-frame': {
    code: `import { NSafeAreaProvider, NText, useNSafeAreaFrame } from 'nayan-ui/components';

function Frame() {
  const frame = useNSafeAreaFrame();
  return <NText>{frame.width} × {frame.height}</NText>;
}

export default function Example() {
  return <NSafeAreaProvider><Frame /></NSafeAreaProvider>;
}`
  },
  'use-safe-area-insets': {
    code: `import { NSafeAreaProvider, NText, useNSafeAreaInsets } from 'nayan-ui/components';

function Insets() {
  const { top, bottom } = useNSafeAreaInsets();
  return <NText>Top {top} · Bottom {bottom}</NText>;
}

export default function Example() {
  return <NSafeAreaProvider><Insets /></NSafeAreaProvider>;
}`
  },
  'use-theme': {
    code: themeCode
  },
  'video-player': {
    note: 'Serve a video file from your app and pass its URL to VideoPlayer.',
    code: `import { VideoPlayer } from 'nayan-ui/video';

export default function Example() {
  return (
    <VideoPlayer source="/nayan-ui/reference-orbit.mp4" controls muted contentFit="contain"
      accessibilityLabel="Orbit sample clip" style={{ width: '100%', height: '100%', backgroundColor: '#171e31' }} />
  );
}`
  }
};
