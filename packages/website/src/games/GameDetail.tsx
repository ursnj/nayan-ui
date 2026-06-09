'use client';

import { Award, Check, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/helpers/Sidebar';
import { type GameData, gamesData } from '@/services/GamesData';

const categoryColors: Record<string, string> = {
  Puzzle: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/25',
  Action: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/25',
  Arcade: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/25',
  Strategy: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25'
};

interface Props {
  slug: string;
}

const GameDetail = ({ slug }: Props) => {
  const game = gamesData[slug];

  if (!game) {
    return (
      <Sidebar title="Game Not Found">
        <p className="text-muted">The requested game could not be found.</p>
      </Sidebar>
    );
  }

  return (
    <Sidebar title={game.name}>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-amber-600/10 border border-purple-500/15 mb-8">
        <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm rounded-2xl" />
        <div className="relative px-4 sm:px-6 py-8">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryColors[game.category]}`}>{game.category}</span>
                <span className="text-xs font-medium bg-default/50 text-muted px-2.5 py-1 rounded-full">{game.difficulty}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                  {game.emoji} {game.name}
                </span>
              </h2>
              <p className="text-muted text-base leading-relaxed mb-4">{game.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {game.tags.map((tag, idx) => (
                  <span key={idx} className="text-[11px] font-medium bg-default/50 text-muted px-2 py-0.5 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative mx-auto max-w-xs">
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
                <img src={`/games/${game.id}.png`} alt={`${game.name} - ${game.category} Game`} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">About {game.name}</h2>
        <p className="text-muted leading-relaxed">{game.longDescription}</p>
      </section>

      {/* Features */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Game Features</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {game.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 rounded-lg border border-default bg-surface p-4">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
              <span className="text-sm text-muted">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How to Play */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">How to Play</h2>
        <div className="rounded-xl border border-default bg-surface p-6">
          <ol className="space-y-3">
            {game.howToPlay.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    [
                      'bg-blue-500 text-white',
                      'bg-purple-500 text-white',
                      'bg-pink-500 text-white',
                      'bg-amber-500 text-white',
                      'bg-emerald-500 text-white',
                      'bg-red-500 text-white'
                    ][index % 6]
                  }`}>
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm text-muted">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Tips & Strategies */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Tips & Strategies</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {game.tips.map((tip, index) => (
            <div key={index} className="rounded-xl border border-default bg-surface p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 flex-shrink-0 text-amber-500" />
                <p className="text-sm text-muted">{tip}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      {game.benefits.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Why Play {game.name}?</h2>
          <div className="rounded-xl border border-default bg-surface p-6">
            <div className="grid gap-3 md:grid-cols-2">
              {game.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Award className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500" />
                  <span className="text-sm font-medium text-muted">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Games */}
      {game.relatedGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">You Might Also Like</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {game.relatedGames.slice(0, 4).map(relatedId => {
              const relatedGame = gamesData[relatedId];
              if (!relatedGame) return null;
              return (
                <Link
                  key={relatedId}
                  href={`/games/${relatedId}`}
                  className="group overflow-hidden rounded-xl border border-default bg-surface transition-all hover:shadow-lg hover:border-purple-500/30">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={`/games/${relatedId}.png`}
                      alt={`${relatedGame.name} - ${relatedGame.category} Game`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute right-0 bottom-0 left-0 p-3">
                      <h3 className="line-clamp-1 text-sm font-bold text-white">
                        {relatedGame.emoji} {relatedGame.name}
                      </h3>
                      <p className="text-xs text-white/80">{relatedGame.category}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </Sidebar>
  );
};

export default GameDetail;
