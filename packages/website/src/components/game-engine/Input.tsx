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
  engineBoardDragCode,
  engineJoystickCode,
  engineLongPressPinchCode,
  enginePickCode,
  engineToScreenCode,
} from "@/services/GameEngineCodeBlocks";
import {
  dragEventAttributes,
  gestureAttributes,
  joystickAttributes,
  joystickStateAttributes,
  pinchEventAttributes,
  pickHitAttributes,
} from "@/services/GameEngineData";

const EngineInput = () => (
  <Sidebar title="Input">
    <DocsIntro lead="GameView reports taps, swipes, drags, long presses and pinches; world.pick tells you which 3D object is under a finger and world.screenToWorld where the finger is on your board. Together they cover board and puzzle games: pick up a piece, drag it, drop it on a cell. Add the built-in joystick for movement and regular React Native touchables for buttons." />

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
      title="Move pieces on a board"
      description="Pick the piece under the finger, move it to where the finger is on the board with screenToWorld, and snap it to a cell on release."
    >
      <Code code={engineBoardDragCode} filename="Board.tsx" />
      <ul className={`mt-4 space-y-2 ${BODY}`}>
        <li>
          • <code>screenToWorld(x, y, plane)</code> intersects the finger&apos;s ray with a plane:{" "}
          <code>{"{ point, normal }"}</code>, the ground (y = 0) by default. Use the height pieces sit at. 2D games
          looking down -z pass <code>{"{ normal: [0, 0, 1] }"}</code>.
        </li>
        <li>
          • Animating the position with <code>spring: true</code> on every move makes the piece trail the finger
          smoothly; setting <code>position</code> directly sticks it to the finger.
        </li>
        <li>
          • On <code>end</code>, check <code>cancelled</code>: a pinch or the system interrupted the drag, so put
          the piece back.
        </li>
        <li>• Mark the board, cells and labels <code>pickable: false</code> if only pieces should be grabbed.</li>
      </ul>
    </SubHeader>

    <SubHeader
      title="Long press and pinch"
      description="Hold a piece to show its moves; pinch and turn with two fingers to zoom and rotate the board."
    >
      <Code code={engineLongPressPinchCode} filename="Board.tsx" />
    </SubHeader>

    <Attributes title="PinchEvent" data={pinchEventAttributes} headers={{ default: "" }} unit="field" />

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
