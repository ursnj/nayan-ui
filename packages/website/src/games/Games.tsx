import { useLocation } from 'react-router-dom';
import { NLink } from '@nayan-ui/react';
import { getMenuItem } from '@/services/Utils';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';

const games = [
  {
    name: 'Fruit Ninja',
    emoji: '🍎',
    image: 'https://cdn.worklage.com/playtura/screenshots/fruit-ninja.png',
    description: 'Slice flying fruits with finger swipes - avoid the bombs!',
    details: [
      'Fixed 60-second gameplay sessions',
      'Physics-based slicing with particle effects and combo system',
      'Difficulty affects fruit spawn rate and bomb frequency'
    ]
  },
  {
    name: 'Candy Crush',
    emoji: '🍬',
    image: 'https://cdn.worklage.com/playtura/screenshots/candy-crush.png',
    description: 'Match colorful candies in this puzzle game',
    details: [
      'Match-3 puzzle with colorful candies',
      'Create special candies with 4+ matches',
      'Cascading combos and satisfying animations',
      'Difficulty affects level objectives and move limits'
    ]
  },
  {
    name: 'Flappy Bird',
    emoji: '🐦',
    image: 'https://cdn.worklage.com/playtura/screenshots/flappy-bird.png',
    description: 'Navigate bird through pipes with precise timing',
    details: [
      'Classic tap-to-flap mechanics with gravity physics',
      'Navigate through pipes with pixel-perfect collision',
      'Progressive difficulty with increasing pipe speed',
      'Difficulty affects pipe gap size and spawn frequency'
    ]
  },
  {
    name: 'Colors Sort',
    emoji: '🎨',
    image: 'https://cdn.worklage.com/playtura/screenshots/colors-sort.png',
    description: 'Sort colored liquids into matching tubes',
    details: [
      'Sort colored liquids into matching tubes',
      'Logic puzzle with increasing complexity',
      'Satisfying pour animations and sound effects',
      'Difficulty affects number of tubes and colors'
    ]
  },
  {
    name: 'Dino Jump',
    emoji: '🦖',
    image: 'https://cdn.worklage.com/playtura/screenshots/dino-jump.png',
    description: 'Chrome offline dino game - jump to avoid obstacles!',
    details: [
      'Endless runner with tap-to-jump mechanics',
      'Collect stars for extra lives (max 3 lives)',
      'Game durations: easy 2 mins, medium 3 mins, hard 5 mins',
      'Dynamic ground height based on device offset (150px or 250px)',
      'Difficulty affects obstacle spawn rate and game speed'
    ]
  },
  {
    name: 'Popit Fidget',
    emoji: '🫧',
    image: 'https://cdn.worklage.com/playtura/screenshots/popit-fidget.png',
    description: 'Pop satisfying bubbles in this relaxing fidget toy game',
    details: [
      'Relaxing bubble popping with satisfying sound effects',
      'Different bubble shapes and colors for variety',
      'Difficulty affects bubble responsiveness and patterns'
    ]
  },
  {
    name: 'Whack A Mole',
    emoji: '🐱',
    image: 'https://cdn.worklage.com/playtura/screenshots/whack-a-mole.png',
    description: 'Whack cute cats popping from holes - fast reflexes needed!',
    details: [
      'Cat spawn intervals: easy 2000ms, medium 1500ms, hard 1000ms',
      'Cat visible duration: easy 2500ms, medium 2000ms, hard 1500ms',
      'Grid sizes: easy/medium 3x3, hard 4x4'
    ]
  },
  {
    name: 'Balloon Blaster',
    emoji: '🎈',
    image: 'https://cdn.worklage.com/playtura/screenshots/balloon-blaster.png',
    description: 'Pop rising balloons before they escape - quick taps win!',
    details: [
      'Fixed 60-second gameplay sessions',
      'Balloon spawn interval: 1200ms, rise speed: 0.08',
      'Physics-based balloon movement with particle effects'
    ]
  },
  {
    name: 'Space Fighter',
    emoji: '🚀',
    image: 'https://cdn.worklage.com/playtura/screenshots/space-fighter.png',
    description: 'Pilot spaceship through asteroid fields in endless space',
    details: [
      'Horizontal drag controls with smooth spacecraft movement',
      'Dynamic spacecraft positioning based on device offset',
      'Progressive difficulty with asteroid spawn intervals',
      '1-second collision immunity after each hit',
      'Difficulty affects asteroid speed and spawn frequency'
    ]
  },
  {
    name: 'Maze Runner',
    emoji: '🧩',
    image: 'https://cdn.worklage.com/playtura/screenshots/maze-runner.png',
    description: 'Navigate ball through mazes using tilt and physics controls',
    details: [
      'Grid sizes: easy 8x8, medium 10x10, hard 12x12',
      'Procedurally generated mazes with intelligent pathfinding',
      'Game over modal only appears on maze completion (not on stop)',
      'White time display for better visibility',
      'Difficulty affects maze complexity and time limits'
    ]
  },
  {
    name: 'Sliding Numbers',
    emoji: '🔢',
    image: 'https://cdn.worklage.com/playtura/screenshots/sliding-numbers.png',
    description: 'Solve the classic 15-puzzle with numbers',
    details: [
      'Classic 15-puzzle with numbered tiles',
      'Grid sizes: easy 3x3, medium 4x4, hard 5x5',
      'Timer challenge to solve as fast as possible',
      'Smooth tile sliding animations'
    ]
  },
  {
    name: '2048 Game',
    emoji: '🎮',
    image: 'https://cdn.worklage.com/playtura/screenshots/game-2048.png',
    description: 'Merge tiles to reach 2048 and beyond',
    details: [
      'Swipe to merge tiles with same numbers',
      'Reach 2048 tile to win, continue for higher scores',
      'Undo moves feature for strategic gameplay',
      'Difficulty affects starting tile values and spawn rate'
    ]
  },
  {
    name: 'Fruit Merger',
    emoji: '🍉',
    image: 'https://cdn.worklage.com/playtura/screenshots/fruit-merger.png',
    description: 'Merge fruits to create bigger ones',
    details: [
      'Merge fruits to create bigger ones (watermelon evolution)',
      'Physics-based dropping and merging mechanics',
      'Combo system for multiple merges',
      'Difficulty affects merge requirements and spawn rate'
    ]
  },
  {
    name: 'Snake & Eggs',
    emoji: '🐍',
    image: 'https://cdn.worklage.com/playtura/screenshots/snake.png',
    description: 'Classic snake game with modern touch controls',
    details: [
      'Classic snake gameplay with modern touch controls',
      'Swipe or tap to change direction',
      'Grow by eating food, avoid walls and yourself',
      'Difficulty affects snake speed and grid size'
    ]
  }
];

const GamesMain = () => {
  const location = useLocation();
  const component: any = getMenuItem(location.pathname);

  return (
    <Sidebar title={component?.title || 'Games'}>
      <Meta
        title="React Native Games - High-performance games for React Native"
        description="A collection of high-performance games for React Native projects. Built with Skia, Reanimated, and TypeScript for smooth 60fps gameplay across iOS, Android, and Web."
        keywords="react native games, mobile games, skia games, react native skia, fruit ninja, candy crush, flappy bird, 2048, snake game, react native reanimated"
      />

      {/* Header Section */}
      <div className="bg-card border border-border rounded-lg mb-8">
        <div className="px-6 py-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4">
                <span className="text-white font-bold text-2xl">🎮</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-text">react-native-games</h1>
            </div>
            <p className="text-xl text-muted leading-relaxed mb-8">
              A collection of high-performance games for your React Native projects. Built with modern React Native technologies including Skia,
              Reanimated, Gesture Handler and TypeScript for smooth 60fps gameplay across iOS, Android, and Web platforms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NLink
                href="https://www.npmjs.com/package/react-native-games"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
                View on NPM
              </NLink>
              <NLink
                href="https://github.com/ursnj/nayan-ui"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-border text-text rounded-lg hover:bg-border/50 transition-colors font-semibold">
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
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text mb-3 flex items-center">
            <span className="mr-2">🚀</span>
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

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text mb-3 flex items-center">
            <span className="mr-2">📱</span>
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

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text mb-3 flex items-center">
            <span className="mr-2">🎵</span>
            Rich Audio & Haptics
          </h3>
          <ul className="text-muted text-sm space-y-1">
            <li>• Sound effects and speech synthesis</li>
            <li>• Haptic feedback for immersive experience</li>
            <li>• Configurable audio settings</li>
            <li>• Per-game sound customization</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            Customizable
          </h3>
          <ul className="text-muted text-sm space-y-1">
            <li>• Multiple difficulty levels</li>
            <li>• Adjustable game parameters</li>
            <li>• Persistent settings storage</li>
            <li>• Unified settings interface</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text mb-3 flex items-center">
            <span className="mr-2">🎮</span>
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

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text mb-3 flex items-center">
            <span className="mr-2">🛠️</span>
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
      <div className="bg-card border border-border rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
          <span className="mr-3">🎯</span>
          Available Games
        </h2>
        <div className="space-y-6">
          {games.map((game, index) => (
            <div key={index} className="bg-background border border-border rounded-lg p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <img src={game.image} alt={game.name} className="w-32 h-32 rounded-lg object-cover" loading="lazy" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-text mb-2 flex items-center">
                  <span className="mr-2">{game.emoji}</span>
                  {game.name}
                </h3>
                <p className="text-muted mb-3">{game.description}</p>
                <ul className="text-muted text-sm space-y-1">
                  {game.details.map((detail, idx) => (
                    <li key={idx}>• {detail}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesMain;
