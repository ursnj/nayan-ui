"use client";

import { DocsIntro } from "@/design/Primitives";
import { BODY } from "@/design/system";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import {
  engineButtonsCode,
  engineGesturesCode,
  engineJoystickCode,
  enginePickCode,
  engineToScreenCode,
} from "@/services/GameEngineCodeBlocks";
import {
  dragEventAttributes,
  gestureAttributes,
  joystickAttributes,
  joystickStateAttributes,
  pickHitAttributes,
} from "@/services/GameEngineData";

const EngineInput = () => (
  <Sidebar title="Input">
    <DocsIntro lead="GameView reports taps, swipes and drags, and world.pick tells you which 3D object was tapped. Add the built-in joystick for movement and regular React Native touchables for buttons." />

    <SubHeader
      title="Taps, swipes and drags"
      description="Pass any of these to GameView. Positions are in points from the view's top-left."
    >
      <Code code={engineGesturesCode} filename="Game.tsx" />
      <ul className={`mt-4 space-y-2 ${BODY}`}>
        <li>
          • <strong>onTap</strong> fires when a finger lifts quickly without moving much.
        </li>
        <li>
          • <strong>onSwipe</strong> fires for a quick flick, with the main direction.
        </li>
        <li>
          • <strong>onDrag</strong> fires on every touch: <code>start</code>, many <code>move</code>s, then{" "}
          <code>end</code>. A tap or swipe also sends drag events.
        </li>
        <li>• GameView only handles touches when at least one of these props is set.</li>
      </ul>
    </SubHeader>

    <Attributes title="Gestures" data={gestureAttributes} headers={{ name: "Prop", type: "Gesture", default: "Fires when" }} unit="gesture" />

    <Attributes title="DragEvent" data={dragEventAttributes} headers={{ default: "" }} unit="field" />

    <SubHeader
      title="Tap 3D objects"
      description="world.pick finds the entity under a point of the GameView. Use it with the x and y from onTap."
    >
      <Code code={enginePickCode} filename="Board.tsx" />
      <p className={`mt-4 ${BODY}`}>
        Picking tests the bounding boxes of what was last drawn, not physics colliders, so it works on entities
        without bodies. Set <code>pickable: false</code> on anything that should let taps through.
      </p>
    </SubHeader>

    <Attributes title="PickHit" data={pickHitAttributes} headers={{ default: "" }} unit="field" />

    <SubHeader
      title="Labels over 3D objects"
      description="world.toScreen turns a world position into GameView points, so you can place React Native views on top."
    >
      <Code code={engineToScreenCode} filename="Game.tsx" />
    </SubHeader>

    <SubHeader
      title="Joystick"
      description="A touch pad that writes a direction into a plain object you read every frame."
    >
      <Code code={engineJoystickCode} filename="Game.tsx" />
    </SubHeader>

    <Attributes title="Joystick props" data={joystickAttributes} />

    <Attributes title="JoystickState" data={joystickStateAttributes} unit="field" />

    <SubHeader title="Buttons and taps">
      <Code code={engineButtonsCode} filename="Game.tsx" />
    </SubHeader>
  </Sidebar>
);

export default EngineInput;
