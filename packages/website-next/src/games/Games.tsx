'use client';

import { NLink } from '@nayan-ui/react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/helpers/Sidebar';
import { getMenuItem } from '@/services/Utils';

const categoryColors: Record<string, string> = {
  Puzzle: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/25',
  Action: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/25',
  Arcade: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/25',
  Strategy: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25'
};

const games = [
  {
    name: 'Block Blast',
    emoji: '🧱',
    category: 'Puzzle',
    image: '/games/block-blast.png',
    description:
      'Block Blast is an addictive puzzle game that combines strategic thinking with quick decision-making. Place different shaped blocks on a grid to create complete lines and clear them for points.',
    tags: ['strategy', 'grid', 'combos', 'offline']
  },
  {
    name: 'Connect Em All',
    emoji: '🔗',
    category: 'Puzzle',
    image: '/games/connect-em-all.png',
    description:
      'Connect matching colored dots on the board to score points. Draw paths between same-colored dots without crossing lines in this brain-teasing color puzzle.',
    tags: ['colors', 'paths', 'logic', 'brain']
  },
  {
    name: 'Bubble Shooter',
    emoji: '🫧',
    category: 'Puzzle',
    image: '/games/bubble-shooter.png',
    description:
      'Aim and shoot bubbles to match 3 or more of the same color. Create chain reactions and clear the board in this classic bubble puzzle with satisfying pop effects.',
    tags: ['match-3', 'aim', 'combos', 'classic']
  },
  {
    name: 'Tile Home',
    emoji: '🀄',
    category: 'Puzzle',
    image: '/games/tile-home.png',
    description:
      'Match 3 tiles of the same type in this mahjong-style puzzle game. Clear stacked layers of tiles by finding matching pairs before time runs out.',
    tags: ['mahjong', 'matching', 'tiles', 'timed']
  },
  {
    name: 'Fruit Ninja',
    emoji: '🍎',
    category: 'Action',
    image: '/games/fruit-ninja.png',
    description:
      'Slice flying fruits with satisfying finger swipes and rack up combos. Avoid the bombs as you slash through physics-based fruit projectiles with particle effects.',
    tags: ['slicing', 'physics', 'combos', 'reflexes']
  },
  {
    name: 'Fruit Merger',
    emoji: '🍉',
    category: 'Puzzle',
    image: '/games/fruit-merger.png',
    description:
      'Drop and merge fruits to create bigger ones in this physics-based puzzle. Combine matching fruits strategically to evolve them all the way to the watermelon.',
    tags: ['merge', 'physics', 'evolution', 'strategy']
  },
  {
    name: 'Flappy Bird',
    emoji: '🐦',
    category: 'Arcade',
    image: '/games/flappy-bird.png',
    description:
      'Tap to flap your wings and navigate through an endless series of pipes. Master the gravity physics and pixel-perfect timing in this iconic arcade challenge.',
    tags: ['tap', 'physics', 'endless', 'classic']
  },
  {
    name: 'Dino Jump',
    emoji: '🦖',
    category: 'Arcade',
    image: '/games/dino-jump.png',
    description:
      'Jump over obstacles and collect stars for extra lives in this endless runner. Dynamic obstacle spawning and progressive speed make every run a unique challenge.',
    tags: ['runner', 'endless', 'jump', 'lives']
  },
  {
    name: 'Dots and Boxes',
    emoji: '⬜',
    category: 'Strategy',
    image: '/games/dots-and-boxes.png',
    description:
      'Connect dots to complete boxes and claim territory in this classic strategy game. Play against a smart AI opponent that adapts to your play style.',
    tags: ['AI', 'turn-based', 'territory', 'classic']
  },
  {
    name: 'Candy Crush',
    emoji: '🍬',
    category: 'Puzzle',
    image: '/games/candy-crush.png',
    description:
      'Match colorful candies in rows of 3 or more to score points. Create special candies with bigger matches and trigger cascading combo chains for massive scores.',
    tags: ['match-3', 'candies', 'combos', 'cascading']
  },
  {
    name: 'Whack A Mole',
    emoji: '🐱',
    category: 'Arcade',
    image: '/games/whack-a-mole.png',
    description:
      'Whack cute cats popping from holes and test your lightning-fast reflexes. Adaptive spawn timing and scalable grid sizes keep the challenge fresh every round.',
    tags: ['reflexes', 'tapping', 'speed', 'fun']
  },
  {
    name: 'Pac-Man',
    emoji: '👾',
    category: 'Arcade',
    image: '/games/pac-man.png',
    description:
      'Navigate the classic maze eating dots while avoiding ghosts. Grab power-up pellets to turn the tables and chase down ghosts in this legendary arcade game.',
    tags: ['maze', 'ghosts', 'power-ups', 'classic']
  },
  {
    name: 'Colors Sort',
    emoji: '🎨',
    category: 'Puzzle',
    image: '/games/colors-sort.png',
    description:
      'Sort colored liquids into matching tubes in this challenging logic puzzle. Plan your pours carefully as complexity increases with more tubes and colors.',
    tags: ['sorting', 'logic', 'liquids', 'brain']
  },
  {
    name: 'Popit Fidget',
    emoji: '🫧',
    category: 'Arcade',
    image: '/games/popit-fidget.png',
    description:
      'Pop satisfying bubbles in this relaxing fidget toy simulation. Multiple bubble shapes and colors with haptic feedback create a calming sensory experience.',
    tags: ['relaxing', 'fidget', 'haptics', 'satisfying']
  },
  {
    name: 'Balloon Blaster',
    emoji: '🎈',
    category: 'Arcade',
    image: '/games/balloon-blaster.png',
    description:
      'Pop rising balloons before they escape the screen in timed 60-second sessions. Physics-based balloon movement with particle effects make every pop satisfying.',
    tags: ['timed', 'popping', 'physics', 'particles']
  },
  {
    name: 'Space Fighter',
    emoji: '🚀',
    category: 'Action',
    image: '/games/space-fighter.png',
    description:
      'Pilot your spaceship through endless asteroid fields using drag controls. Dodge incoming obstacles with collision immunity power-ups in this space survival game.',
    tags: ['space', 'dodge', 'endless', 'survival']
  },
  {
    name: 'Word Search',
    emoji: '🔤',
    category: 'Puzzle',
    image: '/games/word-search.png',
    description:
      'Find hidden words in the letter grid by swiping to select them. Multiple word categories and timed challenges test your vocabulary and pattern recognition.',
    tags: ['words', 'swipe', 'vocabulary', 'timed']
  },
  {
    name: 'Number Search',
    emoji: '🔢',
    category: 'Puzzle',
    image: '/games/number-search.png',
    description:
      'Find hidden number sequences in the digit grid by swiping to select them. Progressive grid sizes and number patterns challenge your observation skills.',
    tags: ['numbers', 'swipe', 'patterns', 'observation']
  },
  {
    name: 'Tank 1990',
    emoji: '🪖',
    category: 'Arcade',
    image: '/games/tank-1990.png',
    description:
      'Command your tank in classic battle warfare. Destroy enemy tanks and defend your base through destructible terrain with intelligent enemy AI patterns.',
    tags: ['battle', 'tanks', 'defense', 'retro']
  },
  {
    name: 'Nuts and Bolts',
    emoji: '🔩',
    category: 'Puzzle',
    image: '/games/nuts-and-bolts.png',
    description:
      'Unscrew bolts and remove planks to solve increasingly complex physics-based puzzles. Plan your moves carefully as each bolt removal affects the entire structure.',
    tags: ['physics', 'bolts', 'mechanics', 'logic']
  },
  {
    name: 'Ludo King',
    emoji: '🎲',
    category: 'Strategy',
    image: '/games/ludo-king.png',
    description:
      'Roll the dice and race your tokens home in this classic board game. Play against AI opponents with strategic token movement and blocking tactics.',
    tags: ['board', 'dice', 'tokens', 'multiplayer']
  },
  {
    name: 'Spider Solitaire',
    emoji: '🃏',
    category: 'Puzzle',
    image: '/games/spider-solitaire.png',
    description:
      'Build card sequences from King to Ace and clear the tableau in this classic solitaire variant. Multiple suit difficulties and undo support for strategic play.',
    tags: ['cards', 'solitaire', 'sequences', 'classic']
  },
  {
    name: 'Maze Runner',
    emoji: '🧩',
    category: 'Puzzle',
    image: '/games/maze-runner.png',
    description:
      'Navigate a ball through procedurally generated mazes using tilt and physics controls. Scalable grid sizes from 8x8 to 12x12 with intelligent pathfinding.',
    tags: ['maze', 'tilt', 'physics', 'procedural']
  },
  {
    name: 'Tic Tac Toe',
    emoji: '❌',
    category: 'Strategy',
    image: '/games/tic-tac-toe.png',
    description:
      'Play the classic X and O game against a smart AI powered by the minimax algorithm. Quick casual matches that challenge your strategic thinking.',
    tags: ['AI', 'classic', 'strategy', 'quick']
  },
  {
    name: 'Car Racing',
    emoji: '🏎️',
    category: 'Action',
    image: '/games/car-racing.png',
    description:
      'Dodge oncoming traffic and race through lanes at increasing speeds. Test your reflexes with smooth lane-switching controls and dynamic traffic obstacles.',
    tags: ['racing', 'traffic', 'lanes', 'reflexes']
  },
  {
    name: 'Bike Racing',
    emoji: '🏍️',
    category: 'Action',
    image: '/games/bike-racing.png',
    description:
      'Race on bikes through dense traffic at high speeds. Faster and more challenging than car racing with tighter gaps and quicker reflex demands.',
    tags: ['racing', 'bikes', 'speed', 'traffic']
  },
  {
    name: 'Sliding Numbers',
    emoji: '🔢',
    category: 'Puzzle',
    image: '/games/sliding-numbers.png',
    description:
      'Slide numbered tiles to solve the classic 15-puzzle. Multiple grid sizes from 3x3 to 5x5 with timer challenges and smooth tile sliding animations.',
    tags: ['sliding', 'tiles', 'classic', 'timed']
  },
  {
    name: '2048',
    emoji: '🎮',
    category: 'Puzzle',
    image: '/games/game-2048.png',
    description:
      'Swipe to merge matching number tiles and reach the legendary 2048 tile. Features undo moves for strategic play and endless mode to chase higher scores.',
    tags: ['merge', 'numbers', 'swipe', 'addictive']
  },
  {
    name: 'Snake 3D',
    emoji: '🐍',
    category: 'Arcade',
    image: '/games/snake-3d.png',
    description:
      'Eat eggs to grow longer while avoiding walls and your own tail in this modern take on the classic snake game. Touch and swipe controls for smooth movement.',
    tags: ['snake', 'growing', 'classic', 'touch']
  },
  {
    name: 'Perfect Circle',
    emoji: '⭕',
    category: 'Action',
    image: '/games/perfect-circle.png',
    description:
      'Draw the most perfect circle you can and get scored on your precision. Finger tracking physics measure your accuracy against a mathematically perfect shape.',
    tags: ['drawing', 'precision', 'scoring', 'unique']
  },
  {
    name: 'Sudoku',
    emoji: '🔟',
    category: 'Puzzle',
    image: '/games/sudoku.png',
    description:
      'Fill the 9x9 grid with numbers 1-9 ensuring no repeats in any row, column, or 3x3 box. Multiple difficulty levels with real-time error validation.',
    tags: ['numbers', 'logic', 'grid', 'classic']
  },
  {
    name: 'Block Breaker',
    emoji: '🧱',
    category: 'Arcade',
    image: '/games/block-breaker.png',
    description:
      'Break all the bricks with a bouncing ball and paddle in this arcade action classic. Ball physics, power-ups, and varied brick pattern levels keep you hooked.',
    tags: ['breakout', 'paddle', 'bricks', 'power-ups']
  },
  {
    name: 'Knife Hit',
    emoji: '🔪',
    category: 'Action',
    image: '/games/knife-hit.png',
    description:
      'Throw knives at a spinning log with precise timing. Avoid hitting other knives already stuck in the log and aim for apples to earn bonus points.',
    tags: ['throwing', 'timing', 'precision', 'bonus']
  },
  {
    name: 'Color Switch',
    emoji: '🌈',
    category: 'Arcade',
    image: '/games/color-switch.png',
    description:
      'Jump through rotating color obstacles by matching your ball to the right segment. Time your taps perfectly to survive increasingly complex patterns.',
    tags: ['colors', 'timing', 'obstacles', 'rhythm']
  },
  {
    name: 'Stack Tower',
    emoji: '🏗️',
    category: 'Arcade',
    image: '/games/stack-tower.png',
    description:
      'Stack sliding blocks with precision timing to build the tallest tower possible. Each misaligned block shrinks the platform, making the challenge progressively harder.',
    tags: ['stacking', 'precision', 'tower', 'timing']
  },
  {
    name: 'Mine Sweeper',
    emoji: '💣',
    category: 'Puzzle',
    image: '/games/mine-sweeper.png',
    description:
      'Reveal all safe cells on the grid without hitting a hidden mine. Use number hints to deduce mine locations and flag suspicious cells in this classic logic game.',
    tags: ['mines', 'logic', 'flags', 'classic']
  },
  {
    name: 'Pipe Connect',
    emoji: '🔧',
    category: 'Puzzle',
    image: '/games/pipe-connect.png',
    description:
      'Rotate pipe segments to connect the water flow from source to sink before time runs out. Plan your pipe layout carefully in this satisfying flow puzzle.',
    tags: ['pipes', 'flow', 'rotation', 'timed']
  }
];

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
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent break-words">react-native-games</span>
              </h1>
            </div>
            <p className="text-base sm:text-xl text-muted leading-relaxed mb-6 sm:mb-8">
              50+ high-performance games for your React Native projects. Built with modern React Native technologies including Skia, Reanimated,
              Gesture Handler and TypeScript for smooth 60fps gameplay across iOS, Android, and Web platforms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NLink
                href="https://www.npmjs.com/package/react-native-games"
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
            <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">🚀</span>
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
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">📱</span>
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
            <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">🎵</span>
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
            <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">🎯</span>
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
            <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">🎮</span>
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
            <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mr-2 text-sm shadow-sm group-hover:scale-110 transition-transform">🛠️</span>
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
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">🎯 All {games.length} Games</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {games.map((game, index) => (
            <div
              key={index}
              className="group bg-surface border border-default rounded-xl overflow-hidden hover:border-purple-500/30 hover:shadow-xl transition-all duration-300">
              <div className="relative overflow-hidden">
                <img
                  src={game.image}
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
            </div>
          ))}
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesMain;
