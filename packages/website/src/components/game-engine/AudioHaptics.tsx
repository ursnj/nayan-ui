"use client";

import { DocsIntro } from "@/design/Primitives";
import { BODY } from "@/design/system";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import {
  engineHapticsCode,
  engineImpactCode,
  engineImpactStrengthCode,
  engineMusicCode,
  engineSoundsCode,
} from "@/services/GameEngineCodeBlocks";
import {
  audioApiAttributes,
  hapticTapAttributes,
  hapticsApiAttributes,
  impactFeedbackAttributes,
  playOptionsAttributes,
  soundBankAttributes,
} from "@/services/GameEngineData";

const EngineAudioHaptics = () => (
  <Sidebar title="Audio & Haptics">
    <DocsIntro lead="Sound and vibration are built into the engine: no extra packages. Sounds are mixed natively with low latency, and impacts can play a sound and a haptic straight from the physics, scaled by how hard things hit." />

    <SubHeader title="Sound effects" description="Load your sounds once, then play them by name.">
      <Code code={engineSoundsCode} filename="sounds.ts" />
    </SubHeader>

    <Attributes title="SoundBank" data={soundBankAttributes} headers={{ type: "Returns", default: "" }} unit="method" />

    <Attributes title="Play options" data={playOptionsAttributes} />

    <SubHeader title="Music and settings">
      <Code code={engineMusicCode} filename="Game.tsx" />
    </SubHeader>

    <Attributes title="audio" data={audioApiAttributes} headers={{ type: "Returns / type" }} unit="member" />

    <SubHeader
      title="Impact feedback"
      description="Let the engine play a sound and a haptic whenever an entity hits something solid."
    >
      <Code code={engineImpactCode} filename="player.ts" />
    </SubHeader>

    <Attributes title="Impact feedback options" data={impactFeedbackAttributes} />

    <SubHeader title="Haptics">
      <Code code={engineHapticsCode} filename="haptics.ts" />
    </SubHeader>

    <Attributes title="haptics" data={hapticsApiAttributes} headers={{ type: "Returns / type" }} unit="member" />

    <Attributes title="Haptic tap" data={hapticTapAttributes} unit="field" />

    <SubHeader
      title="Scale by impact speed"
      description="For your own collision handling, turn the impact speed into a 0..1 strength."
    >
      <Code code={engineImpactStrengthCode} filename="Game.tsx" />
    </SubHeader>

    <SubHeader title="Good to know">
      <ul className={`space-y-2 ${BODY}`}>
        <li>• Sounds are WAV files: mono or stereo, any sample rate.</li>
        <li>• Sounds follow the silent switch and mix with music from other apps.</li>
        <li>• Haptics need a device with a haptic engine: simulators don&apos;t vibrate.</li>
        <li>• On Android, haptics use the vibrator and need the VIBRATE permission (see Installation).</li>
      </ul>
    </SubHeader>
  </Sidebar>
);

export default EngineAudioHaptics;
