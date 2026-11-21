import type { ComponentType } from "react";
import { Component, type ReactNode } from "react";
import { NTheme } from "nayan-ui/components";
import type { ConceptId } from "../catalog";
import * as components from "./ComponentDemos";
import { DemoText } from "./Demo";
import * as games from "./GameDemos";
import * as services from "./ServiceDemos";

const demos = {
  world: games.WorldDemo,
  "game-loop": games.LoopDemo,
  physics: games.PhysicsDemo,
  "entity-animation": games.EntityAnimationDemo,
  effects: games.EffectsDemo,
  input: () => <games.BoardDemo input />,
  "game-assets": games.GameAssetsDemo,
  "score-and-timers": games.ScoreDemo,
  shapes: games.ShapesDemo,
  terrain: games.TerrainDemo,
  board: games.BoardDemo,
  performance: games.PerformanceDemo,
  drawing: games.DrawingDemo,
  core: games.CoreDemo,
  theme: components.ThemeDemo,
  "system-bars": components.SystemBarsDemo,
  controls: components.ControlsDemo,
  forms: components.FormsDemo,
  feedback: components.FeedbackDemo,
  presentation: components.PresentationDemo,
  list: components.ListDemo,
  carousel: components.CarouselDemo,
  drawer: components.DrawerDemo,
  "safe-area": components.SafeAreaDemo,
  interop: components.InteropDemo,
  "view-animation": components.ViewAnimationDemo,
  "shared-element": components.SharedElementDemo,
  markdown: components.MarkdownDemo,
  assets: services.AssetsDemo,
  files: services.FilesDemo,
  storage: services.StorageDemo,
  sqlite: services.SQLiteDemo,
  uuid: services.UuidDemo,
  network: services.NetworkDemo,
  permissions: services.PermissionsDemo,
  location: services.LocationDemo,
  device: services.DeviceDemo,
  audio: services.AudioDemo,
  microphone: services.MicrophoneDemo,
  speech: services.SpeechDemo,
  haptics: services.HapticsDemo,
  video: services.VideoDemo,
  camera: services.CameraDemo,
  "image-picker": services.ImagePickerDemo,
  capture: services.CaptureDemo,
  clipboard: services.ClipboardDemo,
  sharing: services.SharingDemo,
  "keep-awake": services.KeepAwakeDemo,
  review: services.ReviewDemo,
} satisfies Record<ConceptId, ComponentType>;

class DemoErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    return this.state.error ? <DemoText>{this.state.error.message}</DemoText> : this.props.children;
  }
}

export function ConceptPreview({ id }: { id: ConceptId }) {
  const Demo = demos[id];
  return (
    <DemoErrorBoundary key={id}>
      <NTheme defaultTheme="dark" systemBars={false}>
        <Demo />
      </NTheme>
    </DemoErrorBoundary>
  );
}
