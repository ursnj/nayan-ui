'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { AnimationView, useAnimatedStyle, useSharedValue, withTiming } from '@nayan-ui/engine/animations';
import { NButton, NLoading, NPage, NText } from '@nayan-ui/engine/components';
import { DrawingCanvas, DrawingDocument } from '@nayan-ui/engine/drawing';
import { GameView, Joystick, useJoystick, useWorld, warmUpEngine, type Camera, type Entity } from '@nayan-ui/engine/games';
import { NMarkdown } from '@nayan-ui/engine/markdown';
import { VideoPlayer } from '@nayan-ui/engine/video';

function AnimationDemo() {
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle({ opacity });
  const [faded, setFaded] = useState(false);
  return (
    <div className="component-host-demo">
      <AnimationView animatedStyle={style} className="component-animation-block">
        <NText>Animated view</NText>
      </AnimationView>
      <NButton
        className="component-host-button"
        onPress={() => {
          opacity.value = withTiming(faded ? 1 : 0.4);
          setFaded(!faded);
        }}
      >
        {faded ? 'Fade in' : 'Fade out'}
      </NButton>
    </div>
  );
}

function DrawingDemo() {
  const [document, setDocument] = useState<DrawingDocument>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let drawing: DrawingDocument | undefined;
    void warmUpEngine()
      .then(() => {
        if (!active) return;
        drawing = new DrawingDocument(320, 240);
        drawing.setBrush({ brushType: 'MARKER', color: '#1864e8', width: 8, opacity: 1 });
        setDocument(drawing);
      })
      .catch((cause: unknown) => {
        if (active) setError(String(cause));
      });
    return () => {
      active = false;
      drawing?.dispose();
    };
  }, []);
  if (error)
    return (
      <p role="status" className="component-host-demo">
        {error}
      </p>
    );
  if (!document) return <NLoading label="Preparing drawing canvas" />;
  return (
    <div className="component-host-demo">
      <NText tag="p">Draw on the canvas.</NText>
      <div className="component-media-surface">
        <DrawingCanvas document={document} mode="draw" />
      </div>
      <NButton className="component-host-button" onPress={() => document.clear()}>
        Clear drawing
      </NButton>
    </div>
  );
}

function GameViewDemo() {
  const cube = useRef<Entity | null>(null);
  const camera: Camera = { eye: [3, 2, 4], target: [0, 0, 0], fov: 0.65, ortho: 1.25 };
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
      <p role="status" className="component-host-demo">
        {error}
      </p>
    );
  if (!world) return <NLoading label="Preparing scene" />;
  return (
    <div className="component-host-demo">
      <div className="component-media-surface">
        <GameView source={world} camera={camera} style={{ width: '100%', height: '100%' }} onError={(cause) => setError(cause.message)} />
      </div>
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
    </div>
  );
}

function JoystickDemo() {
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
    <div className="component-host-demo component-joystick-demo">
      <Joystick state={stick} size={120} />
      <NText tag="p">X, Y: {position}</NText>
    </div>
  );
}

const markdown =
  '## Release notes\n\nThis preview renders **Markdown** with engine components.\n\n- Interfaces for the web and native\n- Inline code like `useWorld`';

function MarkdownDemo() {
  return (
    <NPage className="p-4">
      <NMarkdown source={markdown} blockSpacing={12} />
    </NPage>
  );
}

function VideoDemo() {
  return (
    <VideoPlayer
      source="/engine-ui/reference-orbit.mp4"
      controls
      muted
      accessibilityLabel="Orbit sample clip"
      contentFit="contain"
      style={{ width: '100%', height: '100%', backgroundColor: '#171e31' }}
    />
  );
}

const demos = {
  'animation-view': AnimationDemo,
  'drawing-canvas': DrawingDemo,
  'game-view': GameViewDemo,
  joystick: JoystickDemo,
  'markdown-view': MarkdownDemo,
  'video-player': VideoDemo
} satisfies Record<string, ComponentType>;

export type SpecializedSlug = keyof typeof demos;

export default function SpecializedExamples({ slug }: { slug: SpecializedSlug }) {
  const Demo = demos[slug];
  return <Demo />;
}
