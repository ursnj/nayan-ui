"use client";

import { NLink } from "@nayan-ui/react";
import { usePathname } from "next/navigation";
import { H2_DOC, H3_DOC } from "@/design/system";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import {
  advancedUsageCode,
  clearGameAssetsCode,
  availableGamesCode,
  gameSettingsInterfaceCode,
  installCode,
  installYarnCode,
  peerDepsCode,
  simpleUsageCode,
} from "@/services/GamesCodeBlocks";
import { getMenuItem } from "@/services/Utils";

const GamesInstallation = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Installation"}>
      <div className="mb-8">
        <div className="space-y-4">
          <div className="mb-4">
            <Code language="bash" code={installCode} />
            <p className="text-muted text-sm mt-2 text-center">or</p>
            <Code language="bash" code={installYarnCode} />
          </div>

          <div className="mb-4">
            <h3 className={H3_DOC}>Peer Dependencies</h3>
            <p className="text-muted text-sm mb-3">
              This library requires the following peer dependencies to be installed in your project:
            </p>
            <Code language="bash" code={peerDepsCode} />
          </div>

          <div className="mb-4">
            <h3 className={H3_DOC}>Platform Setup</h3>
            <p className="text-muted text-sm mb-3">
              Follow the installation guides for each peer dependency:
            </p>
            <ul className="text-muted text-sm space-y-2">
              <li>
                •{" "}
                <NLink href="/engine/installation" className="text-accent hover:underline">
                  @nayan-ui/engine
                </NLink>{" "}
                - Rendering, physics, animation, audio and haptics
              </li>
              <li>
                •{" "}
                <NLink
                  href="https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started"
                  target="_blank"
                  className="text-accent hover:underline"
                >
                  react-native-reanimated
                </NLink>{" "}
                - Animations
              </li>
              <li>
                •{" "}
                <NLink
                  href="https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation"
                  target="_blank"
                  className="text-accent hover:underline"
                >
                  react-native-gesture-handler
                </NLink>{" "}
                - Gestures
              </li>
              <li>
                • <strong>react-native-worklets / react-native-svg</strong> - Shared UI and
                animation integration
              </li>
              <li>
                • <strong>expo-asset</strong> - Bundled asset bytes in native release builds
              </li>
              <li>
                • <strong>expo-router / expo-modules-core</strong> - Host navigation and Expo
                integration
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Engine setup and asset caching</h2>
        <p className="text-muted text-sm mb-3">
          Use a native development build containing the engine; Expo Go cannot load its Rust core.
          Rebuild the host app after engine native/codegen updates. The selected heavy game's
          loading screen waits for engine initialization and cache hydration before constructing its
          models. You do not need to configure asset storage or add promise caches in game screens.
        </p>
        <p className="text-muted text-sm mb-3">
          Rust handles mesh hashing, preparation and durable native storage. The web engine uses
          binary IndexedDB records, reads source files on demand and warms recent geometry into
          Rust. Saved records have no expiry or automatic eviction. Browser quotas and permissions
          still apply; unavailable or full storage falls back to session reuse.
        </p>
        <p className="text-muted text-sm mb-3">
          The games library does not require expo-file-system for caching. Host applications may
          still use it for screenshots or drawings. Stop, replay and unmount reuse shared assets;
          they do not clear stored files. See the{" "}
          <NLink href="/engine/cache-performance" className="text-accent hover:underline">
            engine caching guide
          </NLink>{" "}
          for storage behavior and the same API on React and React Native.
        </p>
        <p className="text-muted text-sm mb-3">
          These game components use a React Native host. The engine's browser support does not make
          the games package a plain React DOM library. Use the{" "}
          <NLink href="/engine/react" className="text-accent hover:underline">
            React engine quickstart
          </NLink>{" "}
          for a browser scene with the shared engine API.
        </p>
        <h3 className={H3_DOC}>Clear saved assets from settings</h3>
        <p className="text-muted text-sm mb-3">
          Call clearAssetCache only when the user chooses to clear saved game assets. Await success
          before showing confirmation. Loaded worlds and handles remain valid; assets reload or
          rebuild on the next launch. Other application data is preserved.
        </p>
        <Code code={clearGameAssetsCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Usage</h2>
        <div className="space-y-6">
          <div className="mb-6">
            <h3 className={H3_DOC}>Simple Implementation</h3>
            <p className="text-muted text-sm mb-3">For basic usage without settings persistence:</p>
            <Code code={simpleUsageCode} />
          </div>

          <div className="mb-6">
            <h3 className={H3_DOC}>Advanced Implementation Example</h3>
            <p className="text-muted text-sm mb-3">
              All games use the same props pattern for consistency. Here's a complete example with
              settings persistence and navigation integration:
            </p>
            <Code code={advancedUsageCode} />
          </div>

          <div className="mb-6">
            <h3 className={H3_DOC}>Available Games</h3>
            <p className="text-muted text-sm mb-3">All games use the same props interface:</p>
            <Code code={availableGamesCode} />
          </div>

          <div className="mb-6">
            <h3 className={H3_DOC}>Game Settings & Configuration</h3>
            <p className="text-muted text-sm mb-3">
              All games use the unified GameSettings interface:
            </p>
            <Code code={gameSettingsInterfaceCode} />
          </div>

          <div className="mb-6">
            <h3 className={H3_DOC}>Game Settings</h3>
            <p className="text-muted text-sm mb-3">
              Each game includes built-in settings screens with a unified, simplified interface:
            </p>
            <ul className="text-muted text-sm space-y-2">
              <li>
                • <strong>Difficulty Levels</strong>: Easy, Medium, Hard - each game has custom
                difficulty descriptions and behaviors
              </li>
              <li>
                • <strong>Sound Effects</strong>: Toggle audio feedback on/off
              </li>
              <li>
                • <strong>Haptic Feedback</strong>: Toggle vibration feedback on/off
              </li>
            </ul>
            <p className="text-muted text-sm mt-3">
              All games use a centralized settings system for consistency and ease of maintenance.
              Game durations and difficulty behaviors are customized per game for optimal gameplay
              experience.
            </p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesInstallation;
