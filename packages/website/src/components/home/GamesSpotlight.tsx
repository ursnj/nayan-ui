import { ArrowRight, ArrowUpRight, Box } from '@/design/Icons';
import Link from 'next/link';
import { NView, NText, NCode, NImage } from 'nayan-ui/components';
import { Section } from '@/design/Primitives';
import { BODY, BUTTON_SECONDARY, CARD, EYEBROW, H2, H3, LEAD } from '@/design/system';
import { starterSetupCode } from '@/services/GamesCodeBlocks';
import { GAMES_LIST } from '@/services/GamesData';

const SPOTLIGHT = ['car-racing', 'treasure-hunt', 'block-blast'];

export default function GamesSpotlight() {
  return (
    <NView tag="div" className="home-games-section [border-bottom:1px_solid_var(--border)]">
      <Section id="games" labelledBy="games-heading">
        <NView tag="div" className="mb-7 flex flex-wrap items-end justify-between gap-5 sm:mb-9">
          <NView tag="div" className="max-w-xl">
            <NText tag="p" className={`mb-3 ${EYEBROW}`}>Games</NText>
            <NText tag="h2" id="games-heading" className={H2}>
              Play in your browser
            </NText>
            <NText tag="p" className={`mt-3 ${LEAD}`}>Play a quick round or see how a complete game is built.</NText>
          </NView>
          <Link href="/games" className={BUTTON_SECONDARY}>
            Browse all games <ArrowRight aria-hidden size={16} className="ml-2" />
          </Link>
        </NView>
        <NView tag="div" className="grid gap-3 sm:grid-cols-3 sm:gap-5">
          {SPOTLIGHT.map((id) => {
            const game = GAMES_LIST.find((item) => item.id === id);
            if (!game) return null;

            return (
              <Link key={id} href={`/games/${id}`} data-genre={game.category} className="game-spotlight-card relative flex items-end overflow-hidden [min-height:13.5rem] [aspect-ratio:5_/_4] [border:1px_solid_color-mix(in_srgb,_var(--tone-ink,_var(--accent))_18%,_transparent)] [border-radius:1.3rem] [background:var(--tone-paper,_var(--surface-tertiary))] [&_img]:[height:calc(100%_-_3.7rem)] sm:[aspect-ratio:1] motion-reduce:[&_img]:[transform:none]! motion-reduce:[&_img]:[transition:none]! group">
                <NImage
                  src={`/games/${id}.png`}
                  alt=""
                  width={512}
                  height={512}
                  loading="lazy"
                  className="absolute inset-0 block h-full w-full object-contain p-2 sm:p-3 transition-transform duration-300 group-hover:scale-105"
                />
                <NText tag="span" className="game-spotlight-label relative flex items-end justify-between [gap:0.5rem] w-full [padding:0.78rem_0.95rem] [background:color-mix(in_srgb,_var(--surface)_49%,_var(--tone-paper,_var(--surface-secondary)))] text-foreground">
                  <NText tag="span">
                    <NText tag="span" className="game-spotlight-genre block [color:var(--tone-ink,_var(--accent))] [font-family:var(--font-mono,_monospace)] [font-size:0.68rem] [font-weight:650]">{game.category}</NText>
                    <NText tag="span" className="mt-1 block text-lg font-semibold tracking-tight sm:text-2xl">{game.name}</NText>
                  </NText>
                  <ArrowUpRight aria-hidden size={19} />
                </NText>
              </Link>
            );
          })}
        </NView>
        <NView tag="div" className={`${CARD} mt-5 grid min-w-0 items-center gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]`}>
          <NView tag="div">
            <NView tag="div" className="flex items-center gap-2.5">
              <Box aria-hidden size={20} className="shrink-0 text-accent" />
              <NText tag="h3" className={H3}>Build your first game</NText>
            </NView>
            <NText tag="p" className={`mt-2 ${BODY}`}>Start with the Nayan UI boilerplate for Expo and Vite, then add your first scene.</NText>
            <Link href="/game-engine/first-game" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
              Follow the tutorial <ArrowRight aria-hidden size={15} />
            </Link>
          </NView>
          <NView tag="pre"
            className="min-w-0 overflow-x-auto rounded-lg border border-border bg-background px-4 py-3 font-mono text-xs leading-relaxed text-foreground"
            tabIndex={0}
            aria-label="Nayan UI starter setup commands"
          >
            <NCode tag="code">{`${starterSetupCode}\nbun run web`}</NCode>
          </NView>
        </NView>
      </Section>
    </NView>
  );
}
