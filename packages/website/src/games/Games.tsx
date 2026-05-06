import { useLocation } from 'react-router-dom';
import { NLink } from '@nayan-ui/react';
import { getMenuItem } from '@/services/Utils';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';

const categoryColors: Record<string, string> = {
  Puzzle: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Action: 'bg-red-500/10 text-red-500 border-red-500/20',
  Arcade: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  Strategy: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
};

const games = [
  {
    name: 'Block Blast',
    emoji: '🧱',
    category: 'Puzzle',
    image: '/games/block-blast.png',
    description: 'Place blocks on grid to clear lines - strategic puzzle challenge!',
    features: ['Grid-based strategy', 'Line clearing combos', 'Progressive difficulty']
  },
  {
    name: 'Connect Em All',
    emoji: '🔗',
    category: 'Puzzle',
    image: '/games/connect-em-all.png',
    description: 'Connect matching colored dots to score points!',
    features: ['Color matching logic', 'Path drawing mechanics', 'Increasing complexity']
  },
  {
    name: 'Bubble Shooter',
    emoji: '🫧',
    category: 'Puzzle',
    image: '/games/bubble-shooter.png',
    description: 'Match 3+ bubbles of the same color - classic puzzle fun!',
    features: ['Aim and shoot bubbles', 'Chain reaction combos', 'Classic match-3 gameplay']
  },
  {
    name: 'Tile Home',
    emoji: '🀄',
    category: 'Puzzle',
    image: '/games/tile-home.png',
    description: 'Match 3 tiles of the same type - classic mahjong-style puzzle!',
    features: ['Mahjong-style matching', 'Tile stacking layers', 'Memory and speed challenge']
  },
  {
    name: 'Fruit Ninja',
    emoji: '🍎',
    category: 'Action',
    image: '/games/fruit-ninja.png',
    description: 'Slice flying fruits with finger swipes and combos - avoid the bombs!',
    features: ['Physics-based slicing', 'Combo system & particles', 'Bomb avoidance mechanics']
  },
  {
    name: 'Fruit Merger',
    emoji: '🍉',
    category: 'Puzzle',
    image: '/games/fruit-merger.png',
    description: 'Drop and merge fruits to create bigger ones - reach the watermelon!',
    features: ['Physics-based merging', 'Watermelon evolution chain', 'Strategic drop placement']
  },
  {
    name: 'Flappy Bird',
    emoji: '🐦',
    category: 'Arcade',
    image: '/games/flappy-bird.png',
    description: 'Tap to flap and navigate through pipes - classic arcade challenge!',
    features: ['Tap-to-flap gravity physics', 'Pixel-perfect collision', 'Increasing pipe speed']
  },
  {
    name: 'Dino Jump',
    emoji: '🦖',
    category: 'Arcade',
    image: '/games/dino-jump.png',
    description: 'Jump over obstacles and collect stars for lives - endless runner!',
    features: ['Endless runner mechanics', 'Star collection for lives', 'Dynamic obstacle spawning']
  },
  {
    name: 'Dots and Boxes',
    emoji: '⬜',
    category: 'Strategy',
    image: '/games/dots-and-boxes.png',
    description: 'Connect dots to complete boxes - classic strategy game vs AI!',
    features: ['Play against smart AI', 'Turn-based strategy', 'Grid-based territory control']
  },
  {
    name: 'Candy Crush',
    emoji: '🍬',
    category: 'Puzzle',
    image: '/games/candy-crush.png',
    description: 'Match colorful candies in rows to score points - sweet puzzle fun!',
    features: ['Match-3 mechanics', 'Special candy creation', 'Cascading combo chains']
  },
  {
    name: 'Whack A Mole',
    emoji: '🐱',
    category: 'Arcade',
    image: '/games/whack-a-mole.png',
    description: 'Whack cute cats popping from holes - test your lightning reflexes!',
    features: ['Reflex-based tapping', 'Adaptive spawn timing', 'Scalable grid sizes']
  },
  {
    name: 'Pac-Man',
    emoji: '👾',
    category: 'Arcade',
    image: '/games/pac-man.png',
    description: 'Classic arcade game - eat dots, avoid ghosts, and clear the maze!',
    features: ['Maze navigation', 'Ghost AI behavior', 'Power-up pellets']
  },
  {
    name: 'Colors Sort',
    emoji: '🎨',
    category: 'Puzzle',
    image: '/games/colors-sort.png',
    description: 'Sort colored liquids into matching tubes - challenging logic puzzle!',
    features: ['Liquid pouring physics', 'Logic-based sorting', 'Satisfying animations']
  },
  {
    name: 'Popit Fidget',
    emoji: '🫧',
    category: 'Arcade',
    image: '/games/popit-fidget.png',
    description: 'Pop satisfying bubbles in this relaxing fidget toy simulation game!',
    features: ['Satisfying haptic feedback', 'Multiple bubble shapes', 'Relaxing gameplay']
  },
  {
    name: 'Balloon Blaster',
    emoji: '🎈',
    category: 'Arcade',
    image: '/games/balloon-blaster.png',
    description: 'Pop rising balloons before they escape - quick taps and swipes win!',
    features: ['Timed 60s sessions', 'Physics-based balloons', 'Particle pop effects']
  },
  {
    name: 'Space Fighter',
    emoji: '🚀',
    category: 'Action',
    image: '/games/space-fighter.png',
    description: 'Pilot your spaceship through asteroid fields - endless space survival!',
    features: ['Drag controls', 'Asteroid dodge mechanics', 'Collision immunity system']
  },
  {
    name: 'Word Search',
    emoji: '🔤',
    category: 'Puzzle',
    image: '/games/word-search.png',
    description: 'Find hidden words in the grid - swipe to select letters!',
    features: ['Swipe letter selection', 'Multiple word categories', 'Timed word discovery']
  },
  {
    name: 'Number Search',
    emoji: '🔢',
    category: 'Puzzle',
    image: '/games/number-search.png',
    description: 'Find hidden numbers in the grid - swipe to select digits!',
    features: ['Digit pattern finding', 'Swipe selection', 'Progressive grid sizes']
  },
  {
    name: 'Tank 1990',
    emoji: '🪖',
    category: 'Arcade',
    image: '/games/tank-1990.png',
    description: 'Classic tank battle - destroy enemies and defend your base!',
    features: ['Destructible terrain', 'Enemy AI patterns', 'Base defense strategy']
  },
  {
    name: 'Nuts and Bolts',
    emoji: '🔩',
    category: 'Puzzle',
    image: '/games/nuts-and-bolts.png',
    description: 'Unscrew bolts and remove planks to solve puzzles!',
    features: ['Physics-based mechanics', 'Plank removal logic', 'Increasing complexity']
  },
  {
    name: 'Ludo King',
    emoji: '🎲',
    category: 'Strategy',
    image: '/games/ludo-king.png',
    description: 'Classic board game - roll dice and race your tokens home!',
    features: ['Dice rolling mechanics', 'Token race strategy', 'Play against AI']
  },
  {
    name: 'Spider Solitaire',
    emoji: '🃏',
    category: 'Puzzle',
    image: '/games/spider-solitaire.png',
    description: 'Classic Spider Solitaire - build sequences and clear the tableau!',
    features: ['Card sequence building', 'Multiple suit difficulty', 'Undo move support']
  },
  {
    name: 'Maze Runner',
    emoji: '🧩',
    category: 'Puzzle',
    image: '/games/maze-runner.png',
    description: 'Navigate ball through procedural mazes - tilt and physics controls!',
    features: ['Procedural maze generation', 'Tilt & physics controls', 'Scalable grid sizes']
  },
  {
    name: 'Tic Tac Toe',
    emoji: '❌',
    category: 'Strategy',
    image: '/games/tic-tac-toe.png',
    description: 'Classic X and O game - play against a smart robot!',
    features: ['Smart AI opponent', 'Minimax algorithm', 'Quick casual matches']
  },
  {
    name: 'Car Racing',
    emoji: '🏎️',
    category: 'Action',
    image: '/games/car-racing.png',
    description: 'Dodge traffic and race through lanes - test your reflexes!',
    features: ['Lane-based dodging', 'Traffic obstacle system', 'Increasing speed ramps']
  },
  {
    name: 'Bike Racing',
    emoji: '🏍️',
    category: 'Action',
    image: '/games/bike-racing.png',
    description: 'Race on bikes through traffic - faster and more challenging!',
    features: ['High-speed racing', 'Dense traffic patterns', 'Quick reflex gameplay']
  },
  {
    name: 'Sliding Numbers',
    emoji: '🔢',
    category: 'Puzzle',
    image: '/games/sliding-numbers.png',
    description: 'Slide numbered tiles to solve puzzles - classic sliding puzzle game!',
    features: ['Classic 15-puzzle', 'Multiple grid sizes', 'Timer challenge mode']
  },
  {
    name: '2048',
    emoji: '🎮',
    category: 'Puzzle',
    image: '/games/game-2048.png',
    description: 'Merge matching tiles to reach 2048 and beyond - addictive puzzle!',
    features: ['Swipe to merge tiles', 'Undo moves feature', 'Score chasing beyond 2048']
  },
  {
    name: 'Snake 3D',
    emoji: '🐍',
    category: 'Arcade',
    image: '/games/snake-3d.png',
    description: 'Eat eggs to grow longer and avoid walls - classic snake gameplay!',
    features: ['Touch/swipe controls', 'Growing snake mechanics', 'Wall collision avoidance']
  },
  {
    name: 'Perfect Circle',
    emoji: '⭕',
    category: 'Action',
    image: '/games/perfect-circle.png',
    description: 'Draw the most perfect circle you can - test your precision!',
    features: ['Precision drawing', 'Accuracy scoring', 'Finger tracking physics']
  },
  {
    name: 'Sudoku',
    emoji: '🔟',
    category: 'Puzzle',
    image: '/games/sudoku.png',
    description: 'Fill the 9x9 grid with numbers 1-9 with no repeats in rows or columns!',
    features: ['Classic 9x9 grid logic', 'Multiple difficulty levels', 'Error validation']
  },
  {
    name: 'Block Breaker',
    emoji: '🧱',
    category: 'Arcade',
    image: '/games/block-breaker.png',
    description: 'Break all the bricks with a bouncing ball and paddle - arcade action fun!',
    features: ['Ball physics bouncing', 'Paddle control mechanics', 'Brick pattern levels']
  },
  {
    name: 'Knife Hit',
    emoji: '🔪',
    category: 'Action',
    image: '/games/knife-hit.png',
    description: "Throw knives at the spinning log — don't hit another knife or apple!",
    features: ['Timing-based throws', 'Spinning log physics', 'Apple bonus targets']
  },
  {
    name: 'Color Switch',
    emoji: '🌈',
    category: 'Arcade',
    image: '/games/color-switch.png',
    description: 'Jump through matching color obstacles — time your taps to survive!',
    features: ['Color matching gates', 'Timing-based taps', 'Rotating obstacle patterns']
  },
  {
    name: 'Stack Tower',
    emoji: '🏗️',
    category: 'Arcade',
    image: '/games/stack-tower.png',
    description: 'Stack sliding blocks perfectly to build the tallest tower you can!',
    features: ['Precision block stacking', 'Sliding alignment timing', 'Tower height challenge']
  },
  {
    name: 'Mine Sweeper',
    emoji: '💣',
    category: 'Puzzle',
    image: '/games/mine-sweeper.png',
    description: 'Reveal all safe cells on the grid without hitting a hidden mine!',
    features: ['Classic grid logic', 'Number hint system', 'Flag marking strategy']
  },
  {
    name: 'Pipe Connect',
    emoji: '🔧',
    category: 'Puzzle',
    image: '/games/pipe-connect.png',
    description: 'Rotate pipes to connect the water flow from source to sink in time!',
    features: ['Pipe rotation mechanics', 'Flow path logic', 'Timed puzzle solving']
  }
];

const GamesMain = () => {
  const location = useLocation();
  const component: any = getMenuItem(location.pathname);

  return (
    <Sidebar title={component?.title || 'Games'}>
      <Meta
        title="React Native Games - 50+ High-performance games for React Native"
        description="50+ high-performance games for React Native projects. Built with Skia, Reanimated, and TypeScript for smooth 60fps gameplay across iOS, Android, and Web. Powering Playtura."
        keywords="react native games, mobile games, skia games, react native skia, playtura, block blast, bubble shooter, candy crush, flappy bird, 2048, pac-man, ludo, sudoku, react native reanimated"
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
              50+ high-performance games for your React Native projects. Built with modern React Native technologies including Skia, Reanimated,
              Gesture Handler and TypeScript for smooth 60fps gameplay across iOS, Android, and Web platforms.
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
          <span className="mr-3">🎯</span>
          All {games.length} Games
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <div
              key={index}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              <div className="relative overflow-hidden">
                <img
                  src={game.image}
                  alt={game.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
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
                  {game.features.map((feature, idx) => (
                    <span key={idx} className="text-[11px] font-medium bg-border/50 text-muted px-2 py-0.5 rounded-md">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesMain;
