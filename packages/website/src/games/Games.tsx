'use client';

import { NLink } from '@nayan-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '@/helpers/Sidebar';
import { GAMES_LIST } from '@/services/GamesData';
import { getMenuItem } from '@/services/Utils';

const categoryColors: Record<string, string> = {
  Puzzle: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/25',
  Action: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/25',
  Arcade: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/25',
  Strategy: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25'
};

const GamesMain = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || 'Games'}>
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-amber-600/10 border border-purple-500/15 mb-8">
        <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm rounded-2xl" />
        <div className="relative px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-purple-500/20">
                <span className="text-white font-bold text-2xl">🎮</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent break-words">
                  @nayan-ui/games
                </span>
              </h1>
            </div>
            <p className="text-base sm:text-xl text-muted leading-relaxed mb-6 sm:mb-8">
              50+ high-performance games for your React Native projects. Built with modern React Native technologies including Skia, Reanimated,
              Gesture Handler and TypeScript for smooth 60fps gameplay across iOS, Android, and Web platforms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NLink
                href="https://www.npmjs.com/package/@nayan-ui/games"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-md shadow-purple-500/20">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
                View on NPM
              </NLink>
              <NLink
                href="https://github.com/ursnj/nayan-ui"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-default text-foreground rounded-lg hover:bg-default/50 transition-colors font-semibold">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View Source
              </NLink>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-surface border border-default rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">
              🚀
            </span>
            High Performance
          </h3>
          <ul className="text-muted text-sm space-y-1">
            <li>• 60fps gameplay with React Native Skia</li>
            <li>• Optimized animations using Reanimated 3</li>
            <li>• Delta time physics loops</li>
            <li>• React.memo optimizations</li>
            <li>• Minimal re-renders with direct store subscriptions</li>
          </ul>
        </div>

        <div className="bg-surface border border-default rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">
              📱
            </span>
            Cross-Platform
          </h3>
          <ul className="text-muted text-sm space-y-1">
            <li>• iOS, Android, and Web support</li>
            <li>• Consistent performance across platforms</li>
            <li>• Responsive design for all screen sizes</li>
            <li>• Dynamic offset handling for notches</li>
            <li>• Adaptive UI components</li>
          </ul>
        </div>

        <div className="bg-surface border border-default rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">
              🎵
            </span>
            Rich Audio & Haptics
          </h3>
          <ul className="text-muted text-sm space-y-1">
            <li>• Sound effects and speech synthesis</li>
            <li>• Haptic feedback for immersive experience</li>
            <li>• Configurable audio settings</li>
            <li>• Per-game sound customization</li>
          </ul>
        </div>

        <div className="bg-surface border border-default rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">
              🎯
            </span>
            Customizable
          </h3>
          <ul className="text-muted text-sm space-y-1">
            <li>• Multiple difficulty levels</li>
            <li>• Adjustable game parameters</li>
            <li>• Persistent settings storage</li>
            <li>• Unified settings interface</li>
          </ul>
        </div>

        <div className="bg-surface border border-default rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">
              🎮
            </span>
            Game Features
          </h3>
          <ul className="text-muted text-sm space-y-1">
            <li>• Physics simulation and collisions</li>
            <li>• Particle systems and visual effects</li>
            <li>• Procedural generation (mazes, obstacles)</li>
            <li>• Score systems and achievements</li>
            <li>• Progressive difficulty scaling</li>
          </ul>
        </div>

        <div className="bg-surface border border-default rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">
              🛠️
            </span>
            Developer Friendly
          </h3>
          <ul className="text-muted text-sm space-y-1">
            <li>• TypeScript support throughout</li>
            <li>• Shared components (GameControlButton, ScoreBoard)</li>
            <li>• Consistent API across all games</li>
            <li>• Easy integration and customization</li>
            <li>• Comprehensive documentation</li>
          </ul>
        </div>
      </div>

      {/* Available Games Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">🎯 All {GAMES_LIST.length} Games</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {GAMES_LIST.map(game => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="group bg-surface border border-default rounded-xl overflow-hidden hover:border-purple-500/30 hover:shadow-xl transition-all duration-300">
              <div className="relative overflow-hidden">
                <img
                  src={`/games/${game.id}.png`}
                  alt={game.name}
                  className="w-full aspect-square object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryColors[game.category]}`}>{game.category}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-8">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <span className="mr-2 text-xl">{game.emoji}</span>
                    {game.name}
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-muted text-sm mb-3 leading-relaxed">{game.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {game.tags.map((tag, idx) => (
                    <span key={idx} className="text-[11px] font-medium bg-default/50 text-muted px-2 py-0.5 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesMain;
