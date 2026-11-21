import { ArrowRight, ArrowUpRight, Box } from '@/design/Icons';
import Link from 'next/link';
import { NCode, NImage } from '@nayan-ui/engine/components';
import { Section } from '@/design/Primitives';
import { BODY, BUTTON_SECONDARY, CARD, EYEBROW, H2, H3, LEAD } from '@/design/system';
import { gamesExampleSetupCode } from '@/services/GamesCodeBlocks';
import { GAMES_LIST } from '@/services/GamesData';

const SPOTLIGHT = ['car-racing', 'treasure-hunt', 'block-blast'];

export default function GamesSpotlight() {
  return (
    <div className="home-games-section">
      <Section id="games" labelledBy="games-heading">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5 sm:mb-9">
          <div className="max-w-xl">
            <p className={`mb-3 ${EYEBROW}`}>Games</p>
            <h2 id="games-heading" className={H2}>
              Play in your browser
            </h2>
            <p className={`mt-3 ${LEAD}`}>Play a quick round or see how a complete game is built.</p>
          </div>
          <Link href="/games" className={BUTTON_SECONDARY}>
            Browse all games <ArrowRight aria-hidden size={16} className="ml-2" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">
          {SPOTLIGHT.map((id) => {
            const game = GAMES_LIST.find((item) => item.id === id);
            if (!game) return null;

            return (
              <Link key={id} href={`/games/${id}`} data-genre={game.category} className="game-spotlight-card group">
                <NImage
                  src={`/games/${id}.png`}
                  alt=""
                  width={512}
                  height={512}
                  loading="lazy"
                  className="absolute inset-0 block h-full w-full object-contain p-2 sm:p-3 transition-transform duration-300 group-hover:scale-105"
                />
                <span className="game-spotlight-label">
                  <span>
                    <span className="game-spotlight-genre">{game.category}</span>
                    <span className="mt-1 block text-lg font-semibold tracking-tight sm:text-2xl">{game.name}</span>
                  </span>
                  <ArrowUpRight aria-hidden size={19} />
                </span>
              </Link>
            );
          })}
        </div>
        <div className={`${CARD} mt-5 grid min-w-0 items-center gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]`}>
          <div>
            <div className="flex items-center gap-2.5">
              <Box aria-hidden size={20} className="shrink-0 text-accent" />
              <h3 className={H3}>Build your first game</h3>
            </div>
            <p className={`mt-2 ${BODY}`}>Run the Car Racing example with Expo and Vite, then build on it.</p>
            <Link href="/game-engine/first-game" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
              Follow the tutorial <ArrowRight aria-hidden size={15} />
            </Link>
          </div>
          <pre
            className="min-w-0 overflow-x-auto rounded-lg border border-border bg-background px-4 py-3 font-mono text-xs leading-relaxed text-foreground"
            tabIndex={0}
            aria-label="Car Racing setup commands"
          >
            <NCode tag="code">{`${gamesExampleSetupCode}\nbun run web`}</NCode>
          </pre>
        </div>
      </Section>
    </div>
  );
}
