"use client";

import Link from "next/link";
import { DocsIntro } from "@/design/Primitives";
import { ACCENT_TEXT, BODY } from "@/design/system";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import {
  engineAndroidConfigCode,
  engineBareIosCode,
  engineCheckCode,
  engineExpoBuildCode,
  engineInstallBunCode,
  engineInstallCode,
} from "@/services/GameEngineCodeBlocks";

const EngineInstallation = () => (
  <Sidebar title="Installation">
    <DocsIntro
      lead={
        <>
          Install the engine together with{" "}
          <Link
            href="https://github.com/wcandillon/react-native-webgpu"
            target="_blank"
            rel="noopener noreferrer"
            className={`font-medium ${ACCENT_TEXT}`}
          >
            react-native-webgpu
          </Link>
          , which it uses to draw on the GPU. Everything else, including physics, sound and haptics, is
          inside the engine.
        </>
      }
    />

    <SubHeader title="Install" description="The engine and its one peer dependency.">
      <Code language="bash" code={engineInstallCode} filename="terminal" />
      <p className="my-2 text-center text-sm text-muted">or</p>
      <Code language="bash" code={engineInstallBunCode} filename="terminal" />
    </SubHeader>

    <SubHeader title="Requirements">
      <ul className={`space-y-2 ${BODY}`}>
        <li>• React Native with the New Architecture.</li>
        <li>• iOS, and Android 8.0 or newer (API 26).</li>
        <li>
          • A development build. The engine includes native code, so it won&apos;t run in Expo Go.
        </li>
      </ul>
    </SubHeader>

    <SubHeader title="Build the app" description="Rebuild once after installing so the native code is linked.">
      <h3 className="mb-2 text-sm font-semibold text-foreground">Expo</h3>
      <Code language="bash" code={engineExpoBuildCode} filename="terminal" />
      <h3 className="mb-2 mt-6 text-sm font-semibold text-foreground">React Native CLI</h3>
      <Code language="bash" code={engineBareIosCode} filename="terminal" />
    </SubHeader>

    <SubHeader
      title="Android setup"
      description="Android needs version 8.0 or newer (minSdkVersion 26), and the vibrate permission for haptics. In Expo, install expo-build-properties and add:"
    >
      <Code language="json" code={engineAndroidConfigCode} filename="app.json" />
      <p className={`mt-4 ${BODY}`}>
        React Native CLI: set <code>minSdkVersion = 26</code> in <code>android/build.gradle</code> and add the
        VIBRATE permission to <code>AndroidManifest.xml</code>.
      </p>
    </SubHeader>

    <SubHeader
      title="Check it's linked"
      description="Optional: show a friendly message instead of a crash in builds without the native core."
    >
      <Code code={engineCheckCode} filename="App.tsx" />
      <p className={`mt-4 ${BODY}`}>
        Next:{" "}
        <Link href="/game-engine/quick-start" className={`font-medium ${ACCENT_TEXT}`}>
          build your first game
        </Link>
        .
      </p>
    </SubHeader>
  </Sidebar>
);

export default EngineInstallation;
