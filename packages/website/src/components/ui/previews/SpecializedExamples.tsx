'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { AnimationView, useAnimatedStyle, useSharedValue, withTiming } from 'nayan-ui/animations';
import { NView, NButton, NLoading, NPage, NText } from 'nayan-ui/components';
import { DrawingCanvas, DrawingDocument } from 'nayan-ui/drawing';
import { GameView, Joystick, useJoystick, useWorld, warmUpEngine, type Camera, type Entity } from 'nayan-ui/games';
import { NMarkdown } from 'nayan-ui/markdown';
import { VideoPlayer } from 'nayan-ui/video';

function AnimationDemo({ alternate }: DemoProps) {
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle({ opacity });
  const [faded, setFaded] = useState(false);
  return (
    <NView tag="div" className="component-host-demo">
      <AnimationView animatedStyle={style} className="component-animation-block">
        <NText>Animated view</NText>
      </AnimationView>
      <NButton
        className="component-host-button"
        onPress={() => {
          opacity.value = withTiming(faded ? 1 : 0.4, { duration: alternate ? 1000 : 250 });
          setFaded(!faded);
        }}
      >
        {faded ? 'Fade in' : 'Fade out'}
      </NButton>
    </NView>
  );
}

function DrawingDemo({ alternate }: DemoProps) {
  const [document, setDocument] = useState<DrawingDocument>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let drawing: DrawingDocument | undefined;
    void warmUpEngine()
      .then(() => {
        if (!active) return;
        drawing = new DrawingDocument(320, 240);
        drawing.setBrush({ brushType: 'MARKER', color: alternate ? '#bf2786' : '#1864e8', width: alternate ? 16 : 8, opacity: 1 });
        setDocument(drawing);
      })
      .catch((cause: unknown) => {
        if (active) setError(String(cause));
      });
    return () => {
      active = false;
      drawing?.dispose();
    };
  }, [alternate]);
  if (error)
    return (
      <NText tag="p" role="status" className="component-host-demo">
        {error}
      </NText>
    );
  if (!document) return <NLoading label="Preparing drawing canvas" />;
  return (
    <NView tag="div" className="component-host-demo">
      <NText tag="p">Draw on the canvas.</NText>
      <NView tag="div" className="component-media-surface">
        <DrawingCanvas document={document} mode="draw" />
      </NView>
      <NButton className="component-host-button" onPress={() => document.clear()}>
        Clear drawing
      </NButton>
    </NView>
  );
}

function GameViewDemo({ alternate: perspective }: DemoProps) {
  const cube = useRef<Entity | null>(null);
  const camera: Camera = { eye: [3, 2, 4], target: [0, 0, 0], fov: 0.65, ortho: perspective ? undefined : 1.25 };
  const [alternate, setAlternate] = useState(false);
  const [error, setError] = useState('');
  const world = useWorld(
    32,
    (world) => {
      cube.current = world.spawn({ mesh: 'cube', color: '#699cff' });
    },
    [],
    (cause) => setError(cause.message)
  );
  if (error)
    return (
      <NText tag="p" role="status" className="component-host-demo">
        {error}
      </NText>
    );
  if (!world) return <NLoading label="Preparing scene" />;
  return (
    <NView tag="div" className="component-host-demo">
      <NView tag="div" className="component-media-surface">
        <GameView source={world} camera={camera} style={{ width: '100%', height: '100%' }} onError={(cause) => setError(cause.message)} />
      </NView>
      <NButton
        className="component-host-button"
        onPress={() => {
          if (cube.current === null) return;
          world.set(cube.current, { color: alternate ? '#699cff' : '#48d9a5' });
          setAlternate(!alternate);
        }}
      >
        {alternate ? 'Show blue cube' : 'Show green cube'}
      </NButton>
    </NView>
  );
}

function JoystickDemo({ alternate }: DemoProps) {
  const stick = useJoystick();
  const [position, setPosition] = useState('0.00, 0.00');
  useEffect(() => {
    let frame: number;
    function sample() {
      setPosition(`${stick.x.toFixed(2)}, ${stick.y.toFixed(2)}`);
      frame = requestAnimationFrame(sample);
    }
    frame = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(frame);
  }, [stick]);
  return (
    <NView tag="div" className="component-host-demo component-joystick-demo">
      <Joystick state={stick} size={alternate ? 84 : 120} style={{ background: '#2e1853', borderColor: '#8655d8' }} />
      <NText tag="p">X, Y: {position}</NText>
    </NView>
  );
}

const markdown =
  '## Release notes\n\nThis preview renders **Markdown** with engine components.\n\n- Interfaces for the web and native\n- Inline code like `useWorld`';

function MarkdownDemo({ alternate }: DemoProps) {
  return (
    <NPage className="p-4">
      <NMarkdown source={alternate ? markdownTaskList : markdown} blockSpacing={12} />
    </NPage>
  );
}

function VideoDemo({ alternate }: DemoProps) {
  return (
    <VideoPlayer
      source="/nayan-ui/reference-orbit.mp4"
      controls
      muted
      accessibilityLabel="Orbit sample clip"
      loop={alternate}
      contentFit={alternate ? 'cover' : 'contain'}
      style={{ width: '100%', height: '100%', backgroundColor: '#171e31' }}
    />
  );
}

export const markdownTaskList = '## Launch notes\n\n> Ship small, test often.\n\n1. Build the app\n2. Review the release\n3. Publish';
type DemoProps = { alternate?: boolean };

const demos = {
  'animation-view': AnimationDemo,
  'drawing-canvas': DrawingDemo,
  'game-view': GameViewDemo,
  joystick: JoystickDemo,
  'markdown-view': MarkdownDemo,
  'video-player': VideoDemo
} satisfies Record<string, ComponentType<DemoProps>>;

export type SpecializedSlug = keyof typeof demos;

export default function SpecializedExamples({ slug, alternate }: DemoProps & { slug: SpecializedSlug }) {
  const Demo = demos[slug];
  return <Demo alternate={alternate} />;
}
