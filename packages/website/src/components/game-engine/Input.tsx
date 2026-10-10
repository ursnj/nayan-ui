"use client";

import { DocsIntro } from "@/design/Primitives";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import { engineButtonsCode, engineJoystickCode } from "@/services/GameEngineCodeBlocks";
import { joystickAttributes } from "@/services/GameEngineData";

const EngineInput = () => (
  <Sidebar title="Input">
    <DocsIntro lead="Use the built-in joystick for movement and regular React Native touchables for everything else. Input is read inside onUpdate, so it never triggers a React re-render." />

    <SubHeader
      title="Joystick"
      description="A touch pad that writes a direction into a plain object you read every frame."
    >
      <Code code={engineJoystickCode} filename="Game.tsx" />
    </SubHeader>

    <Attributes title="Joystick props" data={joystickAttributes} />

    <SubHeader title="Buttons and taps">
      <Code code={engineButtonsCode} filename="Game.tsx" />
    </SubHeader>
  </Sidebar>
);

export default EngineInput;
