import { Code, Gamepad2, Smartphone, Wrench } from "lucide-react";
import Link from "next/link";
import { CtaPanel } from "@/design/Primitives";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/design/system";

const CallToAction = () => (
  <CtaPanel
    title="Free, and staying that way"
    lead="The components, game engine, video editor and tools are MIT licensed, with no accounts and no paid tier; the ready-made games are free for non-commercial use. If something is missing, the issue tracker is the place to say so."
  >
    <Link href="/react/installation" className={BUTTON_PRIMARY}>
      <Code aria-hidden className="mr-2 h-4 w-4" />
      Start with React
    </Link>
    <Link href="/react-native/installation" className={BUTTON_SECONDARY}>
      <Smartphone aria-hidden className="mr-2 h-4 w-4" />
      Start with React Native
    </Link>
    <Link href="/game-engine/first-game" className={BUTTON_SECONDARY}>
      <Gamepad2 aria-hidden className="mr-2 h-4 w-4" />
      Build a game
    </Link>
    <Link href="/tools" className={BUTTON_SECONDARY}>
      <Wrench aria-hidden className="mr-2 h-4 w-4" />
      Try the tools
    </Link>
  </CtaPanel>
);

export default CallToAction;
