import { useEffect, useRef, useState } from "react";
import {
  AnimationView,
  animations,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type AnimationViewRef,
  type SharedElementSnapshot,
} from "nayan-ui/animations";
import {
  NAlert,
  NBlur,
  NBlurTarget,
  NBadge,
  NButton,
  NCard,
  NCarousel,
  NCheck,
  NConfetti,
  NDisclosure,
  NConfirm,
  NDrawer,
  NImage,
  NInput,
  NList,
  NLoading,
  NPattern,
  NPlatformView,
  NProgress,
  NSafeArea,
  NSelect,
  NSheet,
  NSlider,
  NSwitch,
  NText,
  NTheme,
  NToast,
  NView,
  useNDrawer,
  useNSafeAreaInsets,
  useNTheme,
  type NBlurTargetRef,
  type NListRef,
} from "nayan-ui/components";
import { device } from "nayan-ui/device";
import { SparklesIcon } from "nayan-ui/icons/components/sparkles";
import { NMarkdown, parseFrontMatter } from "nayan-ui/markdown";
import { DemoButton, DemoControls, DemoPanel, DemoSurface, DemoText } from "./Demo";

const texture = require("../assets/textures/grass.png");

export function ThemeDemo() {
  const { theme, resolvedTheme, setTheme } = useNTheme();
  return (
    <DemoSurface height={335}>
      <NCard className="gap-4 rounded-xl border border-border bg-surface p-4">
        <NText className="text-xl font-bold text-foreground">Theme: {resolvedTheme}</NText>
        <NText className="text-muted">
          This card uses semantic colors and a responsive utility layout.
        </NText>
        <NView className="flex-row flex-wrap gap-2">
          {(["light", "dark", "system"] as const).map((mode) => (
            <NButton key={mode} disabled={theme === mode} onPress={() => setTheme(mode)}>
              {mode}
            </NButton>
          ))}
        </NView>
      </NCard>
    </DemoSurface>
  );
}

export function SystemBarsDemo() {
  const [hidden, setHidden] = useState(false);
  const browser = device.getEnvironment() === "browser";
  return (
    <NTheme systemBars={{ statusBarStyle: "light", statusBarHidden: hidden }}>
      <DemoPanel>
        <DemoText>
          {browser
            ? "System bars are available in the native app."
            : "This screen owns its status-bar setting while mounted."}
        </DemoText>
        <DemoButton disabled={browser} onPress={() => setHidden(!hidden)}>
          {hidden ? "Show status bar" : "Hide status bar"}
        </DemoButton>
      </DemoPanel>
    </NTheme>
  );
}

const controls = [
  { value: "music", label: "Music" },
  { value: "effects", label: "Effects" },
  { value: "voice", label: "Voice" },
];

export function ControlsDemo() {
  const [enabled, setEnabled] = useState(true);
  const [selected, setSelected] = useState<string[]>(["music"]);
  return (
    <DemoSurface height={440}>
      <NSwitch label="Enable audio" value={enabled} onValueChange={setEnabled} />
      <NSelect
        label="Audio tracks"
        options={controls}
        isMulti
        isClearable
        disabled={!enabled}
        value={selected}
        onValueChange={setSelected}
      />
      <NBadge>{enabled ? `${selected.length} selected` : "Audio disabled"}</NBadge>
      <NDisclosure title="About audio tracks">
        <NText selectable>
          Choose any combination of sound categories. The app stores the selected keys.
        </NText>
      </NDisclosure>
    </DemoSurface>
  );
}

const modes = [
  { value: "beginner", label: "Beginner" },
  { value: "advanced", label: "Advanced" },
];

export function FormsDemo() {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<string | null>("beginner");
  const [volume, setVolume] = useState(50);
  const [notifications, setNotifications] = useState(false);
  const [result, setResult] = useState("");
  return (
    <DemoSurface keyboard height={530}>
      <NInput label="Display name" placeholder="Ada" value={name} onValueChange={setName} />
      <NSelect
        label="Experience"
        options={modes}
        value={level}
        onChangeOptions={(option) => setLevel(option?.value ?? null)}
      />
      <NSlider label="Volume" min={0} max={100} value={volume} onChange={setVolume} />
      <NCheck label="Send notifications" value={notifications} onChange={setNotifications} />
      <NButton
        disabled={!name.trim()}
        onPress={() =>
          setResult(
            `${name.trim()} · ${level ?? "No level"} · volume ${volume} · notifications ${notifications ? "on" : "off"}`,
          )
        }
      >
        Submit profile
      </NButton>
      {result && <NText>{result}</NText>}
    </DemoSurface>
  );
}

export function FeedbackDemo() {
  const [progress, setProgress] = useState(25);
  const [burst, setBurst] = useState(0);
  return (
    <DemoSurface height={510}>
      <NProgress label="Progress" value={progress} max={100} />
      <NLoading label="Working" animating={progress < 100} />
      <NButton onPress={() => setProgress((value) => (value >= 100 ? 0 : value + 25))}>
        Advance progress
      </NButton>
      <NButton
        onPress={() => {
          NToast.success("The engine rendered this toast.", { title: "Saved" });
          setBurst((value) => value + 1);
        }}
      >
        Show toast and confetti
      </NButton>
      <NConfetti
        run={burst}
        count={36}
        duration={1.4}
        confettiColors={["#60a5fa", "#fbbf24", "#34d399"]}
        className="h-40 w-full"
      />
      <NAlert
        title="Feedback"
        description="Progress, loading, toasts, and particles share the same theme."
      />
    </DemoSurface>
  );
}

export function PresentationDemo() {
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState("No action taken.");
  return (
    <DemoSurface height={300}>
      <NButton onPress={() => setSheet(true)}>Open sheet</NButton>
      <NButton onPress={() => setConfirm(true)}>Open confirmation</NButton>
      <NText>{result}</NText>
      <NSheet title="Details" isOpen={sheet} onOpenChange={setSheet} snapPoints={["60%"]}>
        <NText>The sheet supports drag-to-dismiss and content sizing.</NText>
        <NButton onPress={() => setSheet(false)}>Close sheet</NButton>
      </NSheet>
      <NConfirm
        title="Confirm selection"
        description="Confirm to update the example status."
        isOpen={confirm}
        onOpenChange={setConfirm}
        onResult={(confirmed) => setResult(confirmed ? "Confirmed." : "Cancelled.")}
      />
    </DemoSurface>
  );
}

const players = Array.from({ length: 1000 }, (_, index) => ({
  id: String(index),
  name: `Player ${index + 1}`,
}));

export function ListDemo() {
  const list = useRef<NListRef>(null);
  return (
    <DemoSurface height={490}>
      <NButton onPress={() => list.current?.scrollToIndex({ index: 499, viewPosition: 0.5 })}>
        Jump to player 500
      </NButton>
      <NList
        ref={list}
        data={players}
        keyExtractor={(player) => player.id}
        itemSize={44}
        height={360}
        renderItem={({ item }) => (
          <NCard height={44} className="w-full justify-center rounded-none px-3 py-0">
            <NText>{item.name}</NText>
          </NCard>
        )}
      />
    </DemoSurface>
  );
}

const slides = [
  { title: "Orbit", background: "#16244b", accent: "#93c5fd" },
  { title: "Field", background: "#143b35", accent: "#86efac" },
  { title: "Dusk", background: "#4a2147", accent: "#f9a8d4" },
];

export function CarouselDemo() {
  const [page, setPage] = useState(0);
  return (
    <DemoSurface height={345}>
      <NCarousel
        className="w-full"
        height={216}
        value={page}
        onValueChange={setPage}
        accessibilityLabel="Pattern examples"
      >
        {slides.map(({ title, background, accent }) => (
          <NView
            key={title}
            className="h-full w-full items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: background }}
          >
            <NPattern
              className="absolute inset-0"
              recipe={{
                grid: { spacing: 22, lineWidth: 1, color: "#ffffff22" },
                shapes: [{ kind: "circle", cx: "50%", cy: "50%", r: 48, color: accent }],
              }}
            />
            <NText className="rounded-lg bg-background px-3 py-2 text-foreground">{title}</NText>
          </NView>
        ))}
      </NCarousel>
      <NButton onPress={() => setPage((index) => (index + 1) % slides.length)}>Next slide</NButton>
    </DemoSurface>
  );
}

function DrawerContent() {
  const { close } = useNDrawer();
  return (
    <DemoPanel>
      <DemoText>This panel can also be swiped closed.</DemoText>
      <DemoButton onPress={close}>Close drawer</DemoButton>
    </DemoPanel>
  );
}

function DrawerBody() {
  const { open, isOpen } = useNDrawer();
  return (
    <DemoPanel>
      <DemoText>{isOpen ? "Drawer is open." : "Drawer is closed."}</DemoText>
      <DemoButton onPress={open}>Open drawer</DemoButton>
    </DemoPanel>
  );
}

export function DrawerDemo() {
  return (
    <NView style={{ height: 245, overflow: "hidden", borderRadius: 14 }}>
      <NDrawer width={245} drawerContent={<DrawerContent />}>
        <DrawerBody />
      </NDrawer>
    </NView>
  );
}

export function SafeAreaDemo() {
  const { top, right, bottom, left } = useNSafeAreaInsets();
  return (
    <NSafeArea edges={{ bottom: "maximum" }} style={{ paddingBottom: 16 }}>
      <DemoPanel>
        <DemoText>{`Top ${top} · Right ${right} · Bottom ${bottom} · Left ${left}`}</DemoText>
        <DemoText>This view keeps at least 16 points of bottom padding.</DemoText>
      </DemoPanel>
    </NSafeArea>
  );
}

export function InteropDemo() {
  const target = useRef<NBlurTargetRef>(null);
  const [blur, setBlur] = useState(true);
  const [taps, setTaps] = useState(0);
  return (
    <>
      <DemoSurface height={320}>
        <NView className="flex-row items-center gap-2">
          <SparklesIcon size={22} color="#60a5fa" />
          <NText>Named Lucide icon and bundled image</NText>
        </NView>
        <NImage source={texture} className="h-16 w-full rounded-lg" />
        <NPlatformView id="counter" style={{ width: "100%", height: 52 }}>
          <DemoButton
            onPress={() => setTaps((value) => value + 1)}
          >{`Platform taps: ${taps}`}</DemoButton>
        </NPlatformView>
      </DemoSurface>
      <DemoPanel>
        <NView style={{ height: 100, overflow: "hidden", borderRadius: 8 }}>
          <NBlurTarget ref={target} style={{ flex: 1, backgroundColor: "#1d4ed8" }}>
            <NText style={{ fontSize: 42, color: "#facc15", fontWeight: "900" }}>BACKGROUND</NText>
          </NBlurTarget>
          <NBlur
            blurTarget={target}
            enabled={blur}
            intensity={55}
            style={{
              position: "absolute",
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
              justifyContent: "center",
              paddingHorizontal: 12,
            }}
          >
            <NText style={{ color: "white" }}>Sharp foreground</NText>
          </NBlur>
        </NView>
        <DemoButton onPress={() => setBlur(!blur)}>
          {blur ? "Disable blur" : "Enable blur"}
        </DemoButton>
      </DemoPanel>
    </>
  );
}

export function ViewAnimationDemo() {
  const view = useRef<AnimationViewRef>(null);
  const translateX = useSharedValue(0);
  const animatedStyle = useAnimatedStyle({ translateX });
  const [moved, setMoved] = useState(false);
  return (
    <DemoPanel>
      <AnimationView ref={view} animatedStyle={animatedStyle} style={{ width: 96, height: 72 }}>
        <NView
          style={{
            flex: 1,
            backgroundColor: "#818cf8",
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <NText style={{ color: "#101331", fontWeight: "700" }}>Animate</NText>
        </NView>
      </AnimationView>
      <DemoControls>
        <DemoButton
          onPress={() => {
            translateX.value = withSpring(moved ? 0 : 90);
            setMoved(!moved);
          }}
        >
          {moved ? "Spring back" : "Spring right"}
        </DemoButton>
        <DemoButton onPress={() => animations.playView(view, "pulse")}>Play pulse</DemoButton>
      </DemoControls>
    </DemoPanel>
  );
}

export function SharedElementDemo() {
  const view = useRef<AnimationViewRef>(null);
  const snapshot = useRef<SharedElementSnapshot | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string>();

  async function changeLayout() {
    if (!view.current) return;
    setTransitioning(true);
    setError(undefined);
    try {
      snapshot.current = await animations.captureSharedElement(view.current);
      setExpanded((value) => !value);
    } catch (error) {
      setError(String(error));
      setTransitioning(false);
    }
  }

  useEffect(() => {
    if (!view.current || !transitioning) return;
    const destination = view.current;
    const source = snapshot.current;
    snapshot.current = null;
    let active = true;
    void animations
      .transitionSharedElement(source, destination, { duration: 420 })
      .then((transition) => transition.finished)
      .catch((cause) => {
        if (active) setError(String(cause));
      })
      .finally(() => {
        if (active) setTransitioning(false);
      });
    return () => {
      active = false;
    };
    // A new destination mounts after the source measurement.
  }, [expanded]);

  return (
    <DemoPanel>
      <NView
        style={{
          height: 144,
          alignItems: expanded ? "flex-end" : "flex-start",
          justifyContent: "center",
        }}
      >
        <AnimationView
          key={String(expanded)}
          ref={view}
          initial={{ opacity: transitioning ? 0 : 1 }}
          style={{ width: expanded ? 230 : 120, height: expanded ? 126 : 70 }}
        >
          <NView
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 14,
              backgroundColor: "#3b5998",
            }}
          >
            <NText style={{ color: "white", fontWeight: "700" }}>
              {expanded ? "Expanded card" : "Compact card"}
            </NText>
          </NView>
        </AnimationView>
      </NView>
      <DemoButton disabled={transitioning} onPress={() => void changeLayout()}>
        {expanded ? "Collapse card" : "Expand card"}
      </DemoButton>
      {error && <DemoText>{error}</DemoText>}
    </DemoPanel>
  );
}

const article = parseFrontMatter(`---
{"title":"A tiny field guide"}
---
## First launch

**Prepare** the world, then add a body. Inline code such as \`useWorld\` uses monospace.

- [x] Spawn an entity
- [ ] Add physics

| Body | Motion |
| --- | --- |
| Fixed | Stays put |
| Dynamic | Responds to forces |

> Drag to select and copy this text.`);

export function MarkdownDemo() {
  return (
    <DemoSurface height={510}>
      <NText className="text-xl font-bold">{String(article.data?.title)}</NText>
      <NMarkdown source={article.content} blockSpacing={12} />
    </DemoSurface>
  );
}
