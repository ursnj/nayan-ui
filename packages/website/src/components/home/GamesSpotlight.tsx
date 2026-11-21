import { ArrowRight, Gamepad2, Rocket } from "lucide-react";
import Link from "next/link";
import { NImage, NText, NView } from "@nayan-ui/engine/components";
import { Section, SectionHeader } from "@/design/Primitives";
import { BODY, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD } from "@/design/system";
import { gamesExampleSetupCode } from "@/services/GamesCodeBlocks";
import { GAMES_LIST } from "@/services/GamesData";

const SHOWN = [
  "car-racing",
  "treasure-hunt",
  "block-blast",
  "penguin-run",
  "bubble-shooter",
  "candy-crush",
];
const GamesSpotlight = () => (
  <Section id="games" labelledBy="games-heading">
    <SectionHeader
      eyebrow="Games"
      id="games-heading"
      title="Play a game, or build your own"
      lead="The Nayan Game Engine runs the same 3D game on iOS, Android and the web. Start from the working Car Racing example."
    />
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="space-y-5">
        <div className={`${CARD} overflow-hidden`}>
          <div className="border-b border-default bg-surface px-4 py-2 font-mono text-xs text-muted">
            Terminal
          </div>
          <pre className="overflow-x-auto px-4 py-3 font-mono text-sm text-foreground">
            <code>{`${gamesExampleSetupCode}\nbun run web`}</code>
          </pre>
        </div>
        <NText tag="p" className={BODY}>
          You get an Expo app and a Vite app that share one game: Car Racing, with a city, traffic,
          a scoreboard and a settings modal. Add your own games next to it, or pick from the 50+
          ready-made ones.
        </NText>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/game-engine/first-game" className={BUTTON_PRIMARY}>
            <Rocket aria-hidden className="mr-2 h-5 w-5" />
            Build your first game
          </Link>
          <Link href="/games" className={BUTTON_SECONDARY}>
            <Gamepad2 aria-hidden className="mr-2 h-5 w-5" />
            Play the games
            <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
      <NView tag="div" className={`${CARD} grid grid-cols-3 gap-1.5 overflow-hidden p-1.5`}>
        {SHOWN.map((id) => {
          const game = GAMES_LIST.find((item) => item.id === id);
          return (
            <Link
              key={id}
              href={`/games/${id}`}
              className="overflow-hidden rounded-xl"
              aria-label={`Play ${game?.name ?? id}`}
            >
              <NImage
                src={`/games/${id}.png`}
                alt={game ? `${game.name} screenshot` : ""}
                width={256}
                height={256}
                loading="lazy"
                className="block aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </Link>
          );
        })}
      </NView>
    </div>
  </Section>
);

export default GamesSpotlight;
