import { useCallback, useEffect, useRef, useState } from "react";
import { assets } from "nayan-ui/assets";
import { audio, type Sound, type Voice } from "nayan-ui/audio";
import { camera } from "nayan-ui/camera";
import { capture } from "nayan-ui/capture";
import { clipboard } from "nayan-ui/clipboard";
import { device } from "nayan-ui/device";
import { files } from "nayan-ui/files";
import { warmUpEngine } from "nayan-ui/games";
import { haptics } from "nayan-ui/haptics";
import { imagePicker } from "nayan-ui/image-picker";
import { useKeepAwake } from "nayan-ui/keep-awake";
import { location } from "nayan-ui/location";
import { microphone } from "nayan-ui/microphone";
import { useOnline } from "nayan-ui/network";
import { permissions } from "nayan-ui/permissions";
import { review } from "nayan-ui/review";
import { sharing } from "nayan-ui/sharing";
import { sqlite } from "nayan-ui/sqlite";
import { createStorage, useStorage } from "nayan-ui/storage";
import { speech } from "nayan-ui/tts";
import { prepareUuid, uuid } from "nayan-ui/uuid";
import { VideoPlayer, type VideoPlayerHandle, type VideoStatus } from "nayan-ui/video";
import { ActionDemo, DemoButton, DemoControls, DemoPanel, DemoText } from "./Demo";

const carBody = require("../assets/models/car/car_body.glb");
const engineSound = require("../assets/sfx/engine.wav");
const orbitClip = require("../assets/media/orbit.mp4");
const sampleText = "Hello from the Nayan Engine example.";

export function AssetsDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Read bundled model",
          async run() {
            const { bytes, uri } = await assets.load(carBody);
            return `Read ${bytes.byteLength.toLocaleString()} bytes from ${uri.split("/").at(-1)}.`;
          },
        },
      ]}
    />
  );
}

export function FilesDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Write and read file",
          async run() {
            const directory = await files.openDirectory("engine-example");
            try {
              await directory.writeText("hello.txt", sampleText);
              const value = await directory.readText("hello.txt");
              const list = await directory.list();
              return `Read “${value}”. Directory contains ${list.map((file) => file.name).join(", ")}.`;
            } finally {
              await directory.remove("hello.txt");
            }
          },
        },
        {
          label: "Create temporary file",
          async run() {
            const uri = await files.writeTemporary("SGVsbG8h", {
              fileName: "hello.txt",
              mimeType: "text/plain",
            });
            await files.removeTemporary(uri);
            return "Created and released a temporary text file.";
          },
        },
      ]}
    />
  );
}

const demoStorage = createStorage({ id: "nayan-example-storage" });

export function StorageDemo() {
  const [count, setCount] = useStorage("count", 0, demoStorage);
  return (
    <ActionDemo
      actions={[
        {
          label: "Increment",
          async run() {
            setCount((value) => value + 1);
            await demoStorage.flush();
            return "Saved the counter.";
          },
        },
        {
          label: "Reset",
          run() {
            demoStorage.remove("count");
            return "Removed the example key.";
          },
        },
      ]}
    >
      <DemoText>{`Persisted count: ${count}`}</DemoText>
    </ActionDemo>
  );
}

export function SQLiteDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Query in-memory database",
          run: () =>
            sqlite.withDatabase(undefined, async (db) => {
              await db.run("CREATE TABLE scores (name TEXT NOT NULL, score INTEGER NOT NULL)");
              await db.batch([
                { sql: "INSERT INTO scores VALUES (?, ?)", params: ["Ada", 24] },
                { sql: "INSERT INTO scores VALUES (?, ?)", params: ["Sam", 17] },
              ]);
              const { rows } = await db.query(
                "SELECT name, score FROM scores WHERE score > ? ORDER BY score DESC",
                [10],
              );
              return rows.map(([name, score]) => `${name}: ${score}`).join("\n");
            }),
        },
      ]}
    />
  );
}

export function UuidDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Generate UUID",
          async run() {
            await prepareUuid();
            return uuid();
          },
        },
      ]}
    />
  );
}

export function NetworkDemo() {
  const online = useOnline();
  return (
    <DemoPanel>
      <DemoText>
        {online === null
          ? "Connection state is unknown."
          : online
            ? "The platform reports online."
            : "The platform reports offline."}
      </DemoText>
    </DemoPanel>
  );
}

export function PermissionsDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Check permissions",
          async run() {
            const results = await permissions.checkMany(["camera", "microphone", "location"]);
            return Array.from(results, ([name, result]) => `${name}: ${result.status}`).join("\n");
          },
        },
        {
          label: "Request camera access",
          async run() {
            const result = await permissions.request("camera");
            return `Camera: ${result.status}.${result.requiresSettings ? " Review camera access in your system settings." : ""}`;
          },
        },
      ]}
    />
  );
}

export function LocationDemo() {
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  return (
    <ActionDemo
      actions={[
        {
          label: "Get current position",
          async run() {
            const controller = new AbortController();
            active.current = controller;
            try {
              if (!(await location.isAvailable()) || controller.signal.aborted)
                return "Location is unavailable.";
              const permission = await location.requestPermission("approximate");
              if (permission.status === "denied" || permission.status === "unavailable")
                return `Location: ${permission.status}.`;
              const { latitude, longitude, accuracy } = await location.getCurrentPosition({
                signal: controller.signal,
              });
              return `${latitude.toFixed(4)}, ${longitude.toFixed(4)} · accuracy ${Math.round(accuracy)} m`;
            } finally {
              active.current = null;
            }
          },
        },
      ]}
    >
      <DemoText>Coordinates stay on this screen.</DemoText>
    </ActionDemo>
  );
}

export function DeviceDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Inspect device",
          run: () =>
            `Environment: ${device.getEnvironment()} · Physical device: ${device.isPhysicalDevice() ? "yes" : "no"}`,
        },
      ]}
    />
  );
}

export function AudioDemo() {
  const voice = useRef<Voice | null>(null);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      audio.stop(voice.current);
    };
  }, []);
  return (
    <ActionDemo
      actions={[
        {
          label: "Play WAV",
          async run() {
            const sound = await audio.loadSound(engineSound);
            if (!active.current) return "Playback cancelled.";
            audio.stop(voice.current);
            voice.current = audio.play(sound, { volume: 0.35, loop: true });
            return voice.current ? "Playing a bundled WAV loop." : "Audio playback is unavailable.";
          },
        },
        {
          label: "Stop sound",
          run() {
            audio.stop(voice.current);
            voice.current = null;
            return "Stopped.";
          },
        },
      ]}
    />
  );
}

export function MicrophoneDemo() {
  const active = useRef(true);
  const recording = useRef(false);
  const voice = useRef<Voice | null>(null);
  const sound = useRef<Sound | null>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      if (recording.current) microphone.stop();
      audio.stop(voice.current);
      audio.release(sound.current);
    };
  }, []);
  return (
    <ActionDemo
      actions={[
        {
          label: "Start recording",
          async run() {
            if (recording.current) return "Recording is already active.";
            await warmUpEngine();
            if (!active.current || !microphone.supported) return "Microphone is unavailable.";
            if (!(await microphone.requestPermission()) || !active.current)
              return "Microphone access was not granted.";
            recording.current = microphone.start({ maxSeconds: 5 });
            return recording.current
              ? "Recording. Speak, then choose Finish and listen."
              : "Could not start recording.";
          },
        },
        {
          label: "Finish and listen",
          run() {
            if (!recording.current) return "Start a recording first.";
            const take = microphone.take(5);
            microphone.stop();
            recording.current = false;
            if (!take) return "Nothing was recorded.";
            audio.stop(voice.current);
            audio.release(sound.current);
            sound.current = take.sound;
            voice.current = audio.play(take.sound);
            return `${take.duration.toFixed(1)} seconds recorded · ${take.levels.length} level samples.`;
          },
        },
      ]}
    >
      <DemoText>The take is kept in memory and released when you leave.</DemoText>
    </ActionDemo>
  );
}

export function SpeechDemo() {
  const speaking = useRef(false);
  useEffect(
    () => () => {
      if (speaking.current) void speech.stop().catch(() => {});
    },
    [],
  );
  return (
    <ActionDemo
      actions={[
        {
          label: "Speak sample",
          async run() {
            speaking.current = true;
            await speech.speak(sampleText, { language: "en" });
            return "Sent the sample to system speech.";
          },
        },
        {
          label: "Stop speech",
          async run() {
            await speech.stop();
            speaking.current = false;
            return "Stopped speech.";
          },
        },
        {
          label: "List voices",
          async run() {
            const voices = await speech.getAvailableVoicesAsync();
            return voices.length
              ? voices
                  .slice(0, 5)
                  .map((voice) => voice.name)
                  .join("\n")
              : "No voices reported.";
          },
        },
      ]}
    />
  );
}

export function HapticsDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Impact",
          run() {
            if (!haptics.supported) return "Haptics are unavailable.";
            haptics.impact(0.5);
            return "Sent a light impact.";
          },
        },
        {
          label: "Success",
          run() {
            if (!haptics.supported) return "Haptics are unavailable.";
            haptics.notify("success");
            return "Sent success feedback.";
          },
        },
      ]}
    />
  );
}

export function VideoDemo() {
  const player = useRef<VideoPlayerHandle>(null);
  const [status, setStatus] = useState<VideoStatus>("loading");
  const [time, setTime] = useState(0);
  const [error, setError] = useState<string>();
  return (
    <DemoPanel>
      <VideoPlayer
        ref={player}
        source={orbitClip}
        controls
        muted
        accessibilityLabel="Orbit sample clip"
        onStatusChange={setStatus}
        onProgress={({ currentTime }) => setTime(currentTime)}
        onError={(error) => setError(error.message)}
      />
      <DemoControls>
        <DemoButton onPress={() => player.current?.seek(0)}>Back to start</DemoButton>
      </DemoControls>
      <DemoText>{error ?? `${status} · ${time.toFixed(1)} seconds`}</DemoText>
    </DemoPanel>
  );
}

export function CameraDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Take photo",
          async run() {
            const photo = await camera.takePhoto({ maxDimension: 1024 });
            if (!photo) return "Capture cancelled.";
            try {
              return `Captured ${photo.width} × ${photo.height} · ${photo.mimeType}.`;
            } finally {
              await camera.release(photo.uri);
            }
          },
        },
      ]}
    />
  );
}

export function ImagePickerDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Pick and crop image",
          async run() {
            const result = await imagePicker.pickFromLibrary({
              allowsEditing: true,
              aspect: [1, 1],
              maxDimension: 1024,
            });
            if (result.canceled) return "Selection cancelled.";
            const [image] = result.assets;
            try {
              return `${image.fileName} · ${image.width} × ${image.height}`;
            } finally {
              await imagePicker.release(image.uri);
            }
          },
        },
      ]}
    />
  );
}

export function CaptureDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Capture screen",
          async run() {
            if (!(await capture.isAvailable())) return "Screen capture is unavailable.";
            const image = await capture.screen();
            try {
              return `Captured ${image.width} × ${image.height} PNG.`;
            } finally {
              await capture.release(image.uri);
            }
          },
        },
      ]}
    />
  );
}

export function ClipboardDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Copy sample",
          async run() {
            await clipboard.setString(sampleText);
            return "Copied sample text.";
          },
        },
        {
          label: "Paste text",
          async run() {
            return (await clipboard.getString()) || "The clipboard is empty.";
          },
        },
      ]}
    />
  );
}

export function SharingDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Share sample text",
          async run() {
            if (!(await sharing.isAvailable())) return "System sharing is unavailable.";
            await sharing.share({ title: "Nayan Engine example", text: sampleText });
            return "The share sheet closed.";
          },
        },
      ]}
    />
  );
}

export function KeepAwakeDemo() {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string>();
  const onError = useCallback((cause: unknown) => {
    setError(cause instanceof Error ? cause.message : String(cause));
    setActive(false);
  }, []);
  useKeepAwake(active, onError);
  return (
    <DemoPanel>
      <DemoButton
        onPress={() => {
          setError(undefined);
          setActive(!active);
        }}
      >
        {active ? "Release wake lock" : "Keep display awake"}
      </DemoButton>
      <DemoText>
        {error ?? (active ? "The demo requests a wake lock while visible." : "Wake lock is off.")}
      </DemoText>
    </DemoPanel>
  );
}

export function ReviewDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Request store review",
          async run() {
            if (!(await review.isAvailable()))
              return "Store reviews are unavailable on this device or browser.";
            await review.requestReview();
            return "Request sent. The store decides when to show a prompt.";
          },
        },
      ]}
    />
  );
}
