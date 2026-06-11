export interface GameData {
  id: string;
  name: string;
  emoji: string;
  category: string;
  description: string;
  longDescription: string;
  features: string[];
  howToPlay: string[];
  tips: string[];
  benefits: string[];
  difficulty: string;
  ageRating: string;
  tags: string[];
  relatedGames: string[];
}

export const gamesData: Record<string, GameData> = {
  'block-blast': {
    id: 'block-blast',
    name: 'Block Blast',
    emoji: '🧱',
    category: 'Puzzle',
    description: 'Place blocks on grid to clear lines - strategic puzzle challenge!',
    longDescription:
      'Block Blast is an addictive puzzle game that combines strategic thinking with quick decision-making. Place different shaped blocks on a grid to create complete lines and clear them for points. The game challenges your spatial awareness and planning skills as you try to fit blocks efficiently while preventing the board from filling up. With its simple mechanics but deep strategy, Block Blast offers endless entertainment for puzzle enthusiasts of all ages.',
    features: [
      'Strategic block placement gameplay with unlimited moves',
      'Multiple block shapes and patterns to master',
      'Score multipliers for combo clears and perfect placements',
      'Progressive difficulty levels that adapt to your skill',
      'Colorful and intuitive interface with smooth animations',
      'Offline play — no internet connection required',
      'Achievement system with challenges to complete',
      'Daily challenges for bonus rewards',
      'Undo feature to correct mistakes',
      'Global leaderboards to compete with players worldwide'
    ],
    howToPlay: [
      'Drag and drop blocks from the bottom panel onto the grid',
      'Create complete horizontal or vertical lines to clear them',
      'Plan ahead to maximize space and create combos',
      'Clear multiple lines simultaneously for bonus points',
      'Game ends when no more blocks can be placed',
      'Higher scores unlock new achievements and rewards'
    ],
    tips: [
      'Always keep the center of the board clear for flexibility',
      'Try to clear multiple lines at once for massive bonus points',
      "Don't rush — take time to plan your moves strategically",
      'Save space for larger block pieces by clearing lines early',
      'Focus on creating opportunities for future moves',
      'Use the undo feature wisely for critical mistakes',
      'Complete daily challenges for extra rewards'
    ],
    benefits: [
      'Improves spatial awareness and visual perception',
      'Enhances strategic thinking and planning skills',
      'Boosts problem-solving abilities',
      'Provides stress relief and relaxation',
      'Sharpens concentration and focus',
      'Perfect for short breaks or long gaming sessions'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'strategy', 'block', 'brain-teaser', 'addictive', 'casual'],
    relatedGames: ['bubble-shooter', 'candy-crush', 'game-2048', 'colors-sort']
  },
  'connect-em-all': {
    id: 'connect-em-all',
    name: 'Connect Em All',
    emoji: '🔗',
    category: 'Puzzle',
    description: 'Connect matching colored dots to score points!',
    longDescription:
      "Connect Em All is a beautifully designed puzzle game where you draw flowing lines to connect matching colored dots on a grid. The challenge is to connect every pair of same-colored dots without crossing any lines, while also filling every single square on the board. Each level presents a unique dot configuration that tests your spatial reasoning, path planning, and ability to think several moves ahead. Starting with simple 5x5 grids and progressing to complex 9x9 boards with multiple color pairs, Connect Em All provides a deeply satisfying puzzle experience that's both relaxing and mentally stimulating.",
    features: [
      'Connect matching colored dots with flowing line paths',
      'Every square on the grid must be filled — no empty spaces allowed',
      'Lines cannot cross each other or overlap',
      'Hundreds of handcrafted puzzles with unique solutions',
      'Multiple grid sizes from easy 5x5 to challenging 9x9',
      'Colorful, clean minimalist design with smooth animations',
      'Hint system to help with the toughest puzzles',
      'Progressive difficulty that grows with your skills',
      'Satisfying completion animations and sound effects',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Identify pairs of matching colored dots on the grid',
      'Draw a line from one dot to its matching partner by swiping',
      'Lines can only go horizontally or vertically (not diagonally)',
      'Lines cannot cross over other lines or pass through other dots',
      'Every square on the grid must be covered by a line',
      'Complete all connections and fill the board to solve the puzzle',
      'Use the undo or reset button to try different approaches'
    ],
    tips: [
      'Start with dots that are close together or in corners — they have fewer possible paths',
      'Plan your routes before drawing to avoid blocking other connections',
      'Fill corners and edges first since they have limited routing options',
      'Think about how lines will need to flow around each other',
      'If a path seems forced (only one way to go), draw it first',
      'Undo freely and try different approaches — experimentation is key',
      'On larger grids, solve the outer edges before tackling the center'
    ],
    benefits: [
      'Improves spatial reasoning and path-planning skills',
      'Develops logical thinking and forward planning',
      'Enhances visual perception and pattern recognition',
      'Provides relaxing yet mentally stimulating gameplay',
      'Strengthens problem-solving through creative thinking',
      'Great for all ages — from kids to seniors'
    ],
    difficulty: 'Easy to Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'connect', 'dots', 'logic', 'relaxing', 'casual', 'colorful'],
    relatedGames: ['colors-sort', 'block-blast', 'candy-crush', 'sliding-numbers']
  },
  'bubble-shooter': {
    id: 'bubble-shooter',
    name: 'Bubble Shooter',
    emoji: '🫧',
    category: 'Puzzle',
    description: 'Match 3+ bubbles of the same color - classic puzzle fun!',
    longDescription:
      'Bubble Shooter is a timeless puzzle game that has captivated players for generations. Aim and shoot colored bubbles to create groups of three or more matching bubbles to pop them. The game combines precision aiming with strategic planning as you work to clear the screen before the bubbles reach the bottom. With its colorful graphics, satisfying pop animations, and progressively challenging levels, Bubble Shooter provides a relaxing yet engaging gaming experience.',
    features: [
      'Classic bubble shooting mechanics with precision aiming',
      'Colorful bubble designs with satisfying pop animations',
      'Precision aiming system with trajectory preview',
      'Power-ups and special bubbles for explosive clears',
      'Bank shot mechanics — bounce shots off walls for tricky angles',
      'Progressive difficulty with increasingly complex bubble patterns',
      'High score tracking with personal best records',
      'Relaxing background music and sound effects',
      'Multiple game modes for varied challenges',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Aim your bubble shooter at the cluster of bubbles above',
      'Tap or click to shoot the bubble in the aimed direction',
      'Match 3 or more bubbles of the same color to pop them',
      'Popping bubbles may cause unsupported bubbles above to fall',
      'Clear all bubbles to complete the level',
      'Use walls to bounce shots for tricky angles',
      'Collect special bubbles for powerful effects'
    ],
    tips: [
      'Look for large clusters of same-colored bubbles for big clears',
      'Use bank shots off walls for difficult angles and hard-to-reach spots',
      'Clear bubbles from the top to drop multiple groups at once',
      'Plan several moves ahead — think about what bubble comes next',
      'Save special bubbles for challenging situations',
      'Aim for the connections between clusters to cause chain reactions',
      'Focus on clearing one color at a time for efficiency'
    ],
    benefits: [
      'Improves aim and precision through trajectory planning',
      'Enhances strategic planning and forward thinking',
      'Provides relaxing yet engaging gameplay',
      'Develops color pattern recognition and visual scanning',
      'Strengthens problem-solving through chain reaction planning',
      'Great for all ages — simple to learn, satisfying to master'
    ],
    difficulty: 'Easy to Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'bubble', 'match-3', 'casual', 'relaxing', 'colorful'],
    relatedGames: ['candy-crush', 'block-blast', 'colors-sort', 'fruit-merger']
  },
  'tile-home': {
    id: 'tile-home',
    name: 'Tile Home',
    emoji: '🀄',
    category: 'Puzzle',
    description: 'Match 3 tiles of the same type - classic mahjong-style puzzle!',
    longDescription:
      "Tile Home is a beautifully designed match-3 puzzle game inspired by classic mahjong tile matching that combines relaxation with strategic thinking. Select tiles from layered stacks on the board and place them in your selection bar — when three identical tiles are collected, they're cleared with a satisfying animation. The challenge lies in carefully managing your limited selection slots (only 7 at a time!) and planning which tiles to pick to avoid filling up your bar. With its gorgeous tile designs featuring fruits, animals, flowers, and everyday objects, soothing background music, and hundreds of handcrafted levels, Tile Home provides a calming yet engaging puzzle experience.",
    features: [
      'Mahjong-inspired tile matching with match-3 mechanics',
      'Match 3 identical tiles to clear them from your selection bar',
      'Beautiful hand-drawn tile designs: fruits, animals, flowers, objects',
      'Limited 7-slot selection bar adds strategic depth',
      'Layered tile stacks — uncover hidden tiles beneath',
      'Hundreds of handcrafted levels with unique layouts',
      'Relaxing background music and satisfying sound effects',
      'Undo, shuffle, and extra slot power-ups for tough levels',
      'Progressive difficulty from zen-like easy to brain-teasing hard',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap any visible tile on the board to add it to your selection bar',
      "When 3 identical tiles are in the bar, they're automatically matched and cleared",
      "Your selection bar has only 7 slots — don't let it fill up or you lose!",
      'Tiles may be layered — remove top tiles to reveal hidden ones beneath',
      'Clear all tiles from the board to complete the level',
      'Use the shuffle button to rearrange remaining tiles when stuck',
      'Use the undo button to return the last selected tile to the board'
    ],
    tips: [
      'Always plan 2-3 moves ahead to avoid filling your selection bar',
      'Keep at least 2-3 empty slots in your bar for flexibility',
      'Prioritize matching tiles that are blocking other tiles underneath',
      'Look for tiles that appear in groups of 3 on the visible surface',
      'Use shuffle strategically when no visible matches are available',
      'Clear the deepest stacks first to reveal more matching options',
      'Save undo power-ups for critical moments when your bar is nearly full'
    ],
    benefits: [
      'Provides deep relaxation and stress relief through calming gameplay',
      'Improves pattern recognition and visual memory',
      'Enhances strategic planning and forward thinking',
      'Develops attention to detail and observation skills',
      'Perfect for winding down before sleep',
      'Great for all ages — simple to learn, satisfying to master'
    ],
    difficulty: 'Easy to Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'matching', 'tiles', 'mahjong', 'relaxing', 'casual', 'zen'],
    relatedGames: ['candy-crush', 'block-blast', 'colors-sort', 'connect-em-all']
  },
  'fruit-ninja': {
    id: 'fruit-ninja',
    name: 'Fruit Ninja',
    emoji: '🍎',
    category: 'Action',
    description: 'Slice flying fruits with swipes - avoid the bombs for combo streaks!',
    longDescription:
      'Fruit Ninja is an exhilarating action game that tests your reflexes and hand-eye coordination. Slice through a variety of colorful fruits as they fly across the screen while carefully avoiding dangerous bombs. The game features satisfying slicing mechanics with juice splash effects, combo multipliers for multi-fruit slices, and special fruits that grant powerful bonus effects. With its vibrant graphics, responsive swipe controls, and the perfect balance of skill and luck, Fruit Ninja delivers an endlessly entertaining experience.',
    features: [
      'Fast-paced fruit slicing action with satisfying juice splash effects',
      'Combo system — slice multiple fruits in one swipe for score multipliers',
      'Special fruits with bonus effects (freeze time, double points, frenzy)',
      'Smooth and responsive swipe controls with precise hit detection',
      'Vibrant, colorful graphics with dynamic fruit animations',
      'Bomb avoidance adds strategic element to frantic slicing',
      'Achievement system with milestone challenges',
      'Progressive difficulty with faster and more numerous fruits',
      'Score multipliers for consecutive successful slices',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Swipe across fruits to slice them as they fly across the screen',
      'Slice multiple fruits in one swipe for combo bonuses',
      'Avoid slicing bombs — they end your game immediately',
      "Don't let fruits fall off screen without slicing them",
      'Collect special fruits for power-ups and bonus effects',
      'Build combo streaks for increasing score multipliers',
      'Survive as long as possible to achieve the highest score'
    ],
    tips: [
      'Use quick, precise swipes for better control and accuracy',
      'Watch for bomb patterns and give them a wide berth',
      'Create combos by waiting for fruit clusters before swiping',
      'Focus on critical fruits when the screen gets crowded',
      'Practice different swiping techniques for maximum efficiency',
      'Prioritize special fruits — their bonuses are game-changing',
      'Stay calm during intense moments for more accurate slicing'
    ],
    benefits: [
      'Improves hand-eye coordination and swipe accuracy',
      'Enhances reflexes and reaction time significantly',
      'Provides exciting and satisfying gameplay for all ages',
      'Develops focus and quick decision-making under pressure',
      'Strengthens visual tracking of multiple moving objects',
      'Great stress reliever with satisfying slicing mechanics'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['action', 'arcade', 'reflex', 'fruit', 'slicing', 'fun', 'casual'],
    relatedGames: ['balloon-blaster', 'whack-a-mole', 'knife-hit', 'flappy-bird']
  },
  'fruit-merger': {
    id: 'fruit-merger',
    name: 'Fruit Merger',
    emoji: '🍉',
    category: 'Puzzle',
    description: 'Drop and merge fruits to create bigger ones - reach the watermelon!',
    longDescription:
      'Fruit Merger is a delightful physics-based puzzle game where you drop fruits into a container and merge matching fruits to create larger ones. Start with small cherries and work your way up to the ultimate goal: the watermelon! The game features realistic physics, satisfying merge mechanics, and strategic depth as you manage space in the container. With its cute fruit designs and addictive gameplay, Fruit Merger provides a perfect casual gaming experience.',
    features: [
      'Physics-based fruit dropping with realistic gravity and bouncing',
      'Satisfying merge mechanics — watch two fruits combine into a bigger one',
      'Cute, colorful fruit designs from tiny cherries to giant watermelons',
      'Strategic space management — plan where each fruit lands',
      'Progressive fruit evolution chain: cherry → grape → orange → ... → watermelon',
      'High score challenges with personal best tracking',
      'Relaxing gameplay with calming music and satisfying merge sounds',
      'Colorful graphics with smooth physics animations',
      'Chain reaction merges for massive bonus points',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap or drag to choose where to drop the next fruit into the container',
      'When two identical fruits touch, they merge into the next larger fruit',
      'The evolution chain goes: cherry → grape → orange → apple → pear → ... → watermelon',
      'Manage space carefully — larger fruits take up more room in the container',
      'Reach the legendary watermelon for maximum points',
      "The game ends if fruits stack above the container's top line",
      'Create chain reactions by positioning fruits so merges trigger more merges'
    ],
    tips: [
      'Plan drop positions carefully — think about where merged fruits will end up',
      'Try to keep similar-sized fruits near each other for easier merging',
      'Keep larger fruits at the bottom of the container for stability',
      "Don't let fruits pile up unevenly — balance the container's weight distribution",
      'Use physics to your advantage — fruits roll and settle after dropping',
      'Set up chain reactions by clustering same-type fruits together',
      'Focus on merging small fruits quickly to prevent the container from filling up'
    ],
    benefits: [
      'Improves spatial planning and physics prediction skills',
      'Enhances strategic thinking through merge chain planning',
      'Provides relaxing entertainment with satisfying merge mechanics',
      'Develops physics intuition through gravity-based gameplay',
      'Strengthens forward planning and consequence anticipation',
      'Great for casual gaming — perfect for short breaks or extended sessions'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'merging', 'physics', 'fruit', 'casual', 'cute', 'relaxing'],
    relatedGames: ['game-2048', 'candy-crush', 'block-blast', 'bubble-shooter']
  },
  'flappy-bird': {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    emoji: '🐦',
    category: 'Arcade',
    description: 'Tap to flap and navigate through pipes - classic arcade challenge!',
    longDescription:
      "Flappy Bird is the legendary arcade game that became a global phenomenon. Guide a bird through a series of pipes by tapping the screen to make it flap its wings. The simple one-touch control belies the game's incredibly challenging nature, requiring precise timing, quick reflexes, and steady nerves. With its retro pixel art style, instant restart mechanic, and the addictive drive to beat your high score, Flappy Bird remains one of the most iconic mobile games of all time.",
    features: [
      'Classic one-touch gameplay — tap to flap, release to fall',
      'Retro pixel art graphics with charming character design',
      'Challenging pipe navigation that tests your precision',
      'High score tracking with personal best records',
      'Instant restart for quick retries after each crash',
      'Simple but deeply addictive mechanics',
      'Progressive difficulty as you learn the timing',
      'Satisfying sense of achievement with each new high score',
      'Leaderboard competition to compare scores with friends',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap the screen to make the bird flap its wings upward',
      'Release to let the bird fall with gravity',
      'Navigate through gaps between pairs of green pipes',
      'Avoid touching pipes, the ground, or the ceiling',
      'Each pipe pair passed earns one point',
      'Try to beat your personal high score',
      'Stay calm and maintain a steady tapping rhythm'
    ],
    tips: [
      'Tap gently for small height adjustments — over-tapping is the #1 mistake',
      'Maintain a steady, consistent rhythm between taps',
      'Stay calm and focused — panicking causes erratic tapping',
      'Learn the exact timing between taps for level flight',
      "Practice makes perfect — don't give up after early crashes!",
      'Focus on the gap between pipes, not the pipes themselves',
      'Aim to enter each gap from the center for maximum margin'
    ],
    benefits: [
      'Improves timing precision and reflexes',
      'Enhances sustained focus and concentration',
      'Provides a satisfying classic arcade challenge',
      'Develops patience and persistence through difficulty',
      'Strengthens motor control with precise tap timing',
      'Highly addictive — perfect for short competitive sessions'
    ],
    difficulty: 'Hard',
    ageRating: 'Everyone',
    tags: ['arcade', 'flappy', 'reflex', 'challenging', 'retro', 'addictive'],
    relatedGames: ['dino-jump', 'color-switch', 'stack-tower', 'snake-3d']
  },
  'dino-jump': {
    id: 'dino-jump',
    name: 'Dino Jump',
    emoji: '🦖',
    category: 'Arcade',
    description: 'Jump over obstacles and collect stars - endless dinosaur runner!',
    longDescription:
      'Dino Jump is an exciting endless runner game featuring a cute dinosaur on a prehistoric adventure. Jump over obstacles, collect stars for extra lives, and see how far you can go in this fast-paced arcade experience. The game features smooth animations, progressively increasing difficulty, and a charming prehistoric theme that pays homage to the classic Chrome offline dinosaur game while adding its own unique twist with collectible power-ups and varied obstacle patterns.',
    features: [
      'Endless runner gameplay with one-touch jump controls',
      'Cute dinosaur character with smooth running animations',
      'Collectible stars for extra lives and score bonuses',
      'Increasing speed and difficulty as you progress',
      'Simple one-touch controls — tap to jump, hold for higher jumps',
      'High score tracking with personal best records',
      'Varied obstacle patterns that keep gameplay fresh',
      'Day/night cycle with changing scenery',
      'Achievement milestones for distance and score',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap to make the dinosaur jump over obstacles',
      'Hold longer for higher jumps to clear taller obstacles',
      'Collect stars scattered along the path for extra lives',
      'Avoid crashing into cacti, rocks, and other obstacles',
      'Survive as long as possible as the speed increases',
      'Beat your previous personal high score',
      'Use power-ups to gain temporary advantages'
    ],
    tips: [
      'Time your jumps carefully — early jumps give more clearance',
      'Collect stars whenever safe to do so — extra lives are valuable',
      'Learn recurring obstacle patterns to anticipate what comes next',
      'Stay focused as speed increases — reaction time becomes critical',
      'Practice the timing for short hops vs high jumps',
      'Watch for clusters of obstacles that require precise timing',
      "Don't panic at high speeds — stay calm for better reactions"
    ],
    benefits: [
      'Improves timing and reflexes through obstacle avoidance',
      'Enhances focus and sustained concentration',
      'Provides exciting endless challenge with increasing difficulty',
      'Develops pattern recognition and anticipation skills',
      'Strengthens quick decision-making under pressure',
      'Great for all ages — charming design appeals to everyone'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'runner', 'dinosaur', 'jumping', 'endless', 'casual'],
    relatedGames: ['flappy-bird', 'car-racing', 'bike-racing', 'snake-3d']
  },
  'dots-and-boxes': {
    id: 'dots-and-boxes',
    name: 'Dots and Boxes',
    emoji: '⬜',
    category: 'Strategy',
    description: 'Connect dots to complete boxes - classic strategy game vs AI!',
    longDescription:
      'Dots and Boxes is a classic pen-and-paper strategy game brought to life digitally with smart AI opponents. Take turns connecting adjacent dots with lines, and when you complete the fourth side of a box, you claim it and earn another turn. The player with the most boxes at the end wins. This deceptively simple game hides remarkable strategic depth — every line you draw affects the entire board, and one wrong move can hand your opponent a chain of boxes. Mastering the concepts of chains, sacrifices, and double-dealing makes Dots and Boxes one of the most intellectually rewarding strategy games available.',
    features: [
      'Classic dots and boxes gameplay with authentic rules',
      'Smart AI opponent with multiple difficulty levels',
      'Multiple grid sizes from 3x3 to 6x6 for varying challenge',
      'Turn-based strategy with chain and sacrifice mechanics',
      'Score tracking with win/loss statistics',
      'Clean, minimalist design with smooth line animations',
      'Undo move option for exploring strategies',
      'Color-coded boxes to easily track ownership',
      'Instant restart for quick rematches',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap between two adjacent dots to draw a connecting line',
      'Complete the fourth side of a box to claim it (it turns your color)',
      'Completing a box earns you an extra turn — chain multiple boxes!',
      'The player with the most claimed boxes when all lines are drawn wins',
      'Think ahead — avoid drawing the third side of a box (it gives your opponent the claim)',
      'Use chain strategy: force your opponent to open up multiple boxes for you',
      'Try different grid sizes for varying levels of strategic depth'
    ],
    tips: [
      "Never draw the third side of a box unless you're setting up a chain",
      "Force your opponent to open chains by controlling the board's parity",
      'Control the center of the board — it connects to more potential boxes',
      'Count remaining boxes to plan your endgame strategy',
      'Sacrifice small chains (1-2 boxes) to gain control of larger chains',
      'Learn the "double-dealing" technique to keep control between chains',
      'Start with smaller grids to learn chain strategy before tackling larger ones'
    ],
    benefits: [
      'Develops strategic thinking and long-term planning',
      'Improves logical reasoning and pattern recognition',
      'Enhances mathematical thinking through chain counting',
      'Provides challenging mental exercise for all ages',
      'Teaches concepts of sacrifice and delayed gratification',
      'Great for brain training and cognitive development'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['strategy', 'puzzle', 'classic', 'brain-teaser', 'turn-based', 'logic', 'casual'],
    relatedGames: ['tic-tac-toe', 'ludo-king', 'sliding-numbers', 'game-2048']
  },
  'candy-crush': {
    id: 'candy-crush',
    name: 'Candy Crush',
    emoji: '🍬',
    category: 'Puzzle',
    description: 'Match colorful candies in rows to score - sweet match-3 puzzle!',
    longDescription:
      'Candy Crush is a delightful match-3 puzzle game filled with colorful candies and sweet challenges. Swap adjacent candies to create matches of three or more, triggering satisfying cascades and special candy combinations. The game features strategic depth with special candy mechanics, vibrant graphics with juicy animations, and progressively challenging levels that provide hours of entertainment. Create striped candies, wrapped candies, and color bombs for spectacular board-clearing effects.',
    features: [
      'Classic match-3 gameplay with intuitive swipe controls',
      'Special candy power-ups: striped, wrapped, and color bombs',
      'Cascade combos for massive bonus points and chain reactions',
      'Colorful, vibrant graphics with satisfying candy animations',
      'Strategic gameplay with multiple objectives per level',
      'Various level objectives: score targets, ingredient drops, jelly clears',
      'Progressive difficulty with increasingly complex board layouts',
      'Hint system that suggests the best available move',
      'Satisfying combo effects with screen-shaking animations',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Swap adjacent candies to create matches of 3 or more same-colored candies',
      'Match 3 or more candies of the same color to clear them from the board',
      'Create special candies by matching 4+ candies (striped, wrapped, color bomb)',
      'Combine two special candies for devastating board-clearing effects',
      'Complete level objectives before running out of moves',
      'Use power-ups strategically for tough levels',
      'Create cascades by matching candies at the bottom of the board'
    ],
    tips: [
      'Look for opportunities to create special candies — they clear much more',
      'Plan moves to create cascades from the bottom for chain reactions',
      'Save power-ups for the most difficult situations',
      'Focus on completing level objectives, not just achieving high scores',
      'Match candies at the bottom of the board to create more cascades',
      'Combine two special candies together for the most powerful effects',
      'Take your time — there is no timer, so plan each move carefully'
    ],
    benefits: [
      'Improves pattern recognition and visual scanning',
      'Enhances strategic planning and forward thinking',
      'Provides satisfying and rewarding puzzle solving',
      'Develops color awareness and spatial reasoning',
      'Strengthens decision-making through limited move challenges',
      'Great for all ages — colorful and engaging for everyone'
    ],
    difficulty: 'Easy to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'match-3', 'candy', 'casual', 'colorful', 'addictive'],
    relatedGames: ['bubble-shooter', 'block-blast', 'tile-home', 'colors-sort']
  },
  'whack-a-mole': {
    id: 'whack-a-mole',
    name: 'Whack A Mole',
    emoji: '🐱',
    category: 'Arcade',
    description: 'Whack cute cats popping from holes - test your lightning reflexes!',
    longDescription:
      'Whack A Mole is a fast-paced arcade game that tests your reflexes and hand-eye coordination. Cute cats pop up from various holes, and your job is to tap them before they disappear. The game features multiple difficulty levels, special bonus cats, and increasingly challenging patterns. With its simple yet addictive gameplay, colorful graphics, and satisfying whacking sounds, this game provides endless entertainment. Perfect for improving reaction time while having fun.',
    features: [
      'Fast-paced reflex gameplay with adorable cat characters',
      'Cute animated cats that pop up from holes at varying speeds',
      'Multiple difficulty levels from casual to lightning-fast',
      'Special bonus cats (golden, rainbow) for extra points',
      'Increasing speed challenges that test your reaction limits',
      'Score multipliers for consecutive successful whacks',
      'Colorful, vibrant graphics with satisfying whack animations',
      'Achievement system with milestones for speed and accuracy',
      'Penalty cats to avoid — adds strategic decision-making',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap cats as they pop up from holes on the game board',
      'Score points for each successful whack — faster whacks earn more',
      'Avoid missing too many cats or your game ends',
      'Hit special golden cats for bonus points and score multipliers',
      'Avoid tapping penalty cats (marked differently) — they cost you points',
      'Survive as long as possible as the speed continuously increases',
      'Build consecutive hit streaks for combo multiplier bonuses'
    ],
    tips: [
      'Keep your eyes on the entire board, not just one area',
      'Develop quick tapping reflexes by playing in short, focused sessions',
      "Prioritize special golden cats — they're worth significantly more points",
      "Don't panic when speed increases — stay calm and tap deliberately",
      'Use peripheral vision to spot cats popping up at the edges',
      'Avoid tapping penalty cats even if it means missing a regular one',
      'Practice on easier difficulties first to build muscle memory'
    ],
    benefits: [
      'Improves reaction time and reflexes significantly',
      'Enhances hand-eye coordination through rapid tapping',
      'Develops quick decision-making under time pressure',
      'Provides fun, active stress relief through satisfying gameplay',
      'Strengthens visual attention and peripheral awareness',
      'Great for all ages — kids love the cute cats, adults love the challenge'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'reflex', 'whack-a-mole', 'cats', 'fast-paced', 'fun', 'casual'],
    relatedGames: ['balloon-blaster', 'fruit-ninja', 'flappy-bird', 'dino-jump']
  },
  'pac-man': {
    id: 'pac-man',
    name: 'Pac-Man',
    emoji: '👾',
    category: 'Arcade',
    description: 'Classic arcade game - eat dots, avoid ghosts, and clear the maze!',
    longDescription:
      'Pac-Man is the legendary arcade game that defined an entire generation of gaming. Navigate the iconic maze, eat every dot, and avoid the four colorful ghosts — Blinky, Pinky, Inky, and Clyde — each with their own unique chasing behavior. Grab the flashing power pellets to turn the tables and chase down the ghosts for massive bonus points! With its instantly recognizable sound effects, simple yet addictive gameplay, and the perfect balance of skill and strategy, Pac-Man has entertained billions of players since 1980.',
    features: [
      'Authentic Pac-Man gameplay faithful to the 1980 arcade original',
      'Iconic maze design with dots, power pellets, and bonus fruits',
      'Four unique ghosts with distinct AI personalities and chase patterns',
      'Power pellets that turn ghosts blue and vulnerable for a limited time',
      'Bonus fruits (cherry, strawberry, orange, apple) for extra points',
      'Progressive difficulty — ghosts get faster, power pellets last shorter',
      'Side tunnels for teleporting across the maze to escape ghosts',
      'High score tracking with personal best records',
      'Retro sound effects including the iconic "waka waka"',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Swipe in any direction to move Pac-Man through the maze',
      'Eat all the small dots (pellets) in the maze to clear the level',
      'Avoid the four ghosts — touching one costs you a life',
      'Eat the large flashing power pellets to make ghosts vulnerable (blue)',
      'Chase and eat blue ghosts for bonus points (200, 400, 800, 1600)',
      'Collect bonus fruits that appear in the center for extra points',
      'Use the side tunnels to teleport across the maze and escape ghosts'
    ],
    tips: [
      "Learn each ghost's personality: Blinky chases, Pinky ambushes, Inky flanks, Clyde wanders",
      'Save power pellets for when multiple ghosts are nearby for maximum points',
      'Clear the dangerous areas of the maze first while ghosts are scattered',
      "Use the side tunnels strategically — ghosts slow down in tunnels but you don't",
      'Memorize safe routes and patterns for consistent high scores',
      "Don't chase ghosts too far from your planned route after eating a power pellet",
      'The center of the maze is the most dangerous area — clear it carefully'
    ],
    benefits: [
      'Improves reaction time and quick decision-making',
      'Enhances pattern recognition through ghost behavior learning',
      'Develops strategic route planning and spatial awareness',
      'Provides nostalgic entertainment for retro gaming fans',
      'Teaches risk-reward assessment through power pellet timing',
      'Great for all ages — one of the most accessible games ever made'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['arcade', 'classic', 'retro', 'maze', 'ghosts', 'iconic', 'nostalgic'],
    relatedGames: ['snake-3d', 'tank-1990', 'flappy-bird', 'dino-jump']
  },
  'colors-sort': {
    id: 'colors-sort',
    name: 'Colors Sort',
    emoji: '🎨',
    category: 'Puzzle',
    description: 'Sort colored liquids into matching tubes - satisfying logic puzzle!',
    longDescription:
      'Colors Sort is a captivating logic puzzle game that challenges your problem-solving skills. Pour colored liquids between tubes to sort them by color, with each tube eventually containing only one color. The game starts simple but quickly becomes a brain-teasing challenge as more colors and tubes are introduced. With its beautiful color gradients, satisfying pouring animations, and relaxing pace, Colors Sort provides a perfect blend of mental challenge and calm entertainment.',
    features: [
      'Satisfying liquid pouring mechanics with smooth animations',
      'Beautiful color gradients with realistic liquid physics',
      'Undo moves when needed — experiment without consequences',
      'No time limits — think carefully at your own pace',
      'Progressive difficulty curve with new colors and fewer empty tubes',
      'Relaxing background experience for stress-free gameplay',
      'Multiple puzzle themes and tube designs',
      'Hundreds of handcrafted levels',
      'Hint system for when you get stuck',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap a tube to pick up the top color layer',
      'Tap another tube to pour the color onto it',
      'Only pour onto the same color or into an empty tube',
      'A tube can only hold 4 color layers maximum',
      'Sort all colors so each tube contains only one color',
      'Complete the level when all tubes are sorted or empty',
      'Use the undo button to reverse moves and try different approaches'
    ],
    tips: [
      'Plan several moves ahead — visualize the end state before starting',
      'Keep one tube empty for maneuvering — it gives you flexibility',
      'Start by isolating one color completely before moving to the next',
      'Use the undo button freely to try different strategies',
      "Don't rush — take time to think through the optimal sequence",
      'When stuck, look for colors that are close to being sorted',
      'Focus on freeing colors that are trapped at the bottom of tubes'
    ],
    benefits: [
      'Enhances logical reasoning and sequential thinking',
      'Improves problem-solving skills through constraint-based puzzles',
      'Develops planning abilities and consequence anticipation',
      'Provides relaxing brain training at your own pace',
      'Strengthens visual-spatial reasoning with color management',
      'Perfect for unwinding while keeping your mind active'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'logic', 'sorting', 'brain-teaser', 'strategy', 'relaxing'],
    relatedGames: ['block-blast', 'candy-crush', 'pipe-connect', 'connect-em-all']
  },
  'popit-fidget': {
    id: 'popit-fidget',
    name: 'Popit Fidget',
    emoji: '🫧',
    category: 'Arcade',
    description: 'Pop satisfying bubbles in this relaxing fidget toy simulation!',
    longDescription:
      'Popit Fidget brings the satisfying sensation of popping bubble wrap to your device. This relaxing game simulates the popular fidget toy, offering a stress-relieving experience with colorful bubble grids. Pop bubbles in various patterns and shapes while enjoying the soothing sounds, haptic feedback, and visual effects. Perfect for moments when you need to decompress, Popit Fidget turns idle moments into satisfying sensory experiences.',
    features: [
      'Realistic bubble popping simulation with tactile haptic feedback',
      'Multiple colorful designs, shapes, and themes to choose from',
      'Satisfying ASMR-quality sound effects with each pop',
      'Various game modes: free play, pattern challenges, speed rounds',
      'Stress-relief and relaxation focus — designed for calm',
      'No time pressure in free play mode — pop at your own pace',
      'Flip the board when all bubbles are popped for endless fun',
      'Beautiful color schemes and smooth pop animations',
      'Vibration feedback for immersive sensory experience',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap individual bubbles to pop them with a satisfying click',
      'Swipe across rows of bubbles for rapid multi-pop sequences',
      'Complete pattern challenges by popping bubbles in the right order',
      'Pop all bubbles to flip the board and start fresh',
      'Try speed rounds to test how fast you can clear the board',
      'Experiment with different popping strategies and patterns',
      'Enjoy the satisfying sounds and haptic feedback with each pop'
    ],
    tips: [
      'Take your time and enjoy the sensory experience — no rush',
      'Try creating patterns or shapes while popping for extra fun',
      'Use the game for stress relief during breaks or before bed',
      'Experiment with different popping sequences — corners, spirals, rows',
      'Play with sound on for the full ASMR sensory experience',
      'Challenge yourself with speed rounds when you want excitement',
      'Combine with deep breathing for maximum relaxation benefit'
    ],
    benefits: [
      'Provides immediate stress relief and relaxation',
      'Offers satisfying multi-sensory feedback (visual, audio, haptic)',
      'Perfect for anxiety relief during short breaks',
      'Suitable for all ages — calming for kids and adults alike',
      'Helps with focus and attention through repetitive motion',
      'No competitive pressure — purely enjoyable experience'
    ],
    difficulty: 'Easy',
    ageRating: 'Everyone',
    tags: ['arcade', 'relaxing', 'fidget', 'stress-relief', 'casual', 'satisfying', 'zen'],
    relatedGames: ['balloon-blaster', 'whack-a-mole', 'bubble-shooter', 'candy-crush']
  },
  'balloon-blaster': {
    id: 'balloon-blaster',
    name: 'Balloon Blaster',
    emoji: '🎈',
    category: 'Arcade',
    description: 'Pop rising balloons before they escape - quick taps and swipes win!',
    longDescription:
      'Balloon Blaster is an exciting arcade game where colorful balloons continuously rise from the bottom of the screen. Your mission is to pop them before they escape off the top. The game features various balloon types, power-ups, and increasing difficulty as you progress. With its vibrant colors, satisfying popping sounds, and fast-paced action, Balloon Blaster provides an engaging experience that tests your speed and accuracy.',
    features: [
      'Colorful balloon graphics with vibrant designs and sizes',
      'Fast-paced popping action with rising balloon waves',
      'Various balloon types: regular, bonus, bomb, and speed balloons',
      'Power-ups and bonuses for clearing large groups at once',
      'Combo system — pop multiple balloons quickly for score multipliers',
      'Progressive difficulty with faster and more numerous balloons',
      'Satisfying pop effects with particle explosions and sound',
      'Leaderboard competition to compare scores worldwide',
      'Bomb balloons to avoid — adds strategic element to tapping',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap balloons to pop them before they float off the top of the screen',
      'Swipe through multiple balloons in one motion for combo bonuses',
      "Don't let too many balloons escape off the top or the game ends",
      'Pop special golden balloons for power-ups and score multipliers',
      'Avoid tapping bomb balloons — they explode and cost you a life',
      'Build consecutive pop combos for increasing bonus multipliers',
      'Survive as long as possible as balloon speed and frequency increase'
    ],
    tips: [
      'Use swipe gestures to pop multiple balloons in a single motion',
      "Prioritize balloons near the top of the screen — they're about to escape",
      'Look for clusters of same-colored balloons for efficient clearing',
      'Build combos by popping balloons in rapid succession',
      'Stay calm during intense moments — panicking leads to missed taps',
      'Watch for bomb balloons mixed in with regular ones — avoid them!',
      'Focus on the center of the screen where most balloons pass through'
    ],
    benefits: [
      'Improves hand-eye coordination and tapping accuracy',
      'Enhances reaction speed and visual processing',
      'Provides satisfying stress relief through popping mechanics',
      'Develops quick thinking and split-second decision-making',
      'Strengthens visual tracking of multiple moving objects',
      'Fun for all ages — colorful and engaging for kids and adults'
    ],
    difficulty: 'Easy to Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'balloon', 'popping', 'casual', 'colorful', 'fun', 'fast-paced'],
    relatedGames: ['fruit-ninja', 'whack-a-mole', 'popit-fidget', 'bubble-shooter']
  },
  'space-fighter': {
    id: 'space-fighter',
    name: 'Space Fighter',
    emoji: '🚀',
    category: 'Action',
    description: 'Pilot your spaceship through asteroid fields - endless space survival!',
    longDescription:
      'Space Fighter is a thrilling space shooter game where you pilot a spacecraft through dangerous asteroid fields and enemy territories. Navigate through space, dodge obstacles, and blast enemies while collecting power-ups to enhance your ship. The game features smooth controls, intense action, and beautiful space-themed graphics. With its endless gameplay mode and progressive difficulty, Space Fighter offers an exciting challenge for action game enthusiasts.',
    features: [
      'Intense space combat action with auto-fire shooting mechanics',
      'Smooth spaceship controls — tilt or drag to navigate',
      'Various enemy types: fighters, bombers, drones, and asteroids',
      'Power-up system: shields, rapid fire, spread shot, and magnets',
      'Beautiful space graphics with nebula backgrounds and star fields',
      'Endless survival mode with infinite waves of increasing difficulty',
      'Boss battles at milestone waves with unique attack patterns',
      'Weapon upgrades that persist through your run',
      'Near-miss bonus system for daring close-range dodges',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Drag your finger to move the spaceship around the screen',
      'Your ship automatically fires at enemies — focus on positioning',
      'Dodge asteroids, enemy ships, and incoming projectiles',
      'Collect power-ups (shields, weapons, magnets) dropped by destroyed enemies',
      'Defeat boss enemies that appear at milestone wave intervals',
      'Survive as long as possible to climb the leaderboard',
      'Earn near-miss bonuses by narrowly dodging enemy fire and asteroids'
    ],
    tips: [
      'Keep moving constantly — a stationary ship is an easy target',
      'Prioritize the most dangerous enemies (bombers and bosses) first',
      'Collect power-ups immediately when they appear — they despawn quickly',
      'Learn enemy attack patterns to predict where projectiles will go',
      'Use the edges of the screen to funnel enemies into your line of fire',
      'Save shield power-ups for boss encounters when damage is hardest to avoid',
      'Focus on survival over aggression — staying alive earns more points long-term'
    ],
    benefits: [
      'Improves spatial awareness and multi-directional tracking',
      'Enhances reaction time and reflexes under pressure',
      'Develops strategic thinking through enemy prioritization',
      'Provides exciting, adrenaline-pumping entertainment',
      'Strengthens hand-eye coordination with precise ship control',
      'Great for action game fans seeking a mobile space shooter'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone 10+',
    tags: ['action', 'space', 'shooter', 'arcade', 'survival', 'sci-fi', 'intense'],
    relatedGames: ['car-racing', 'bike-racing', 'fruit-ninja', 'flappy-bird']
  },
  'word-search': {
    id: 'word-search',
    name: 'Word Search',
    emoji: '🔤',
    category: 'Puzzle',
    description: 'Find hidden words in the letter grid - swipe to select them!',
    longDescription:
      'Word Search is a classic puzzle game where you find hidden words in a grid of random letters. Swipe across the letters to highlight words hidden horizontally, vertically, or diagonally. With multiple word categories, timed challenges, and progressive difficulty levels, Word Search tests your vocabulary, pattern recognition, and observation skills. Each puzzle presents a themed set of words to discover, making it both educational and entertaining.',
    features: [
      'Classic word search gameplay with smooth swipe controls',
      'Multiple word categories: animals, food, sports, science, and more',
      'Words hidden in all directions including diagonals and backwards',
      'Timed challenges for competitive puzzle solving',
      'Progressive difficulty with larger grids and more words',
      'Found words highlighted with color-coded lines',
      'Hint system to reveal the first letter of unfound words',
      'Daily puzzles with fresh word sets every day',
      'Educational vocabulary building across many topics',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Scan the letter grid for hidden words from the word list',
      'Swipe across letters to select and highlight a word',
      'Words can be hidden horizontally, vertically, or diagonally',
      'Words may be placed forwards or backwards',
      'Find all words in the list to complete the puzzle',
      'Complete puzzles faster for better time-based scores',
      'Use hints when stuck to reveal the starting position of a word'
    ],
    tips: [
      'Scan for uncommon letter combinations that stand out',
      'Look for the first and last letters of each target word',
      'Check all eight directions — words can go any way',
      'Cross off found words mentally to narrow your search focus',
      'Practice regularly to improve your scanning speed',
      'Start with shorter words — they have fewer possible positions',
      'Scan the grid systematically row by row for thoroughness'
    ],
    benefits: [
      'Builds vocabulary and word recognition across many topics',
      'Improves visual pattern recognition and scanning speed',
      'Enhances sustained concentration and attention to detail',
      'Provides educational entertainment for all ages',
      'Strengthens spelling through visual word identification',
      'Great for language learning and brain training'
    ],
    difficulty: 'Easy to Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'words', 'educational', 'vocabulary', 'brain-teaser', 'relaxing'],
    relatedGames: ['number-search', 'sudoku', 'sliding-numbers', 'maze-runner']
  },
  'number-search': {
    id: 'number-search',
    name: 'Number Search',
    emoji: '🔢',
    category: 'Puzzle',
    description: 'Find hidden number sequences in the digit grid!',
    longDescription:
      'Number Search is a challenging puzzle game where you find hidden number sequences in a grid of digits. Similar to word search but with numbers, swipe to select number patterns hidden horizontally, vertically, or diagonally. Progressive grid sizes and increasingly complex number patterns challenge your observation skills, numerical literacy, and pattern recognition abilities.',
    features: [
      'Number-based search gameplay with intuitive swipe controls',
      'Multiple grid sizes from easy 8x8 to challenging 15x15',
      'Swipe to select number sequences in any direction',
      'Progressive difficulty with longer sequences and larger grids',
      'Pattern recognition challenges with mathematical sequences',
      'Clean, distraction-free interface for focused gameplay',
      'Timer-based scoring for competitive play',
      'Daily number challenges with fresh puzzles',
      'Hint system to reveal starting positions when stuck',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Scan the digit grid for hidden number sequences from the list',
      'Swipe across digits to select a sequence',
      'Sequences can be horizontal, vertical, diagonal, or reversed',
      'Find all sequences listed to complete the puzzle',
      'Faster completion earns better time-based scores',
      'Use hints when stuck to reveal the first digit position',
      'Challenge yourself with larger grid sizes as you improve'
    ],
    tips: [
      'Look for distinctive number patterns — unusual digits stand out',
      'Scan systematically row by row to avoid missing sequences',
      'Check diagonal directions too — many sequences hide diagonally',
      'Mark found sequences mentally to focus on remaining ones',
      'Practice regularly to dramatically improve observation speed',
      'Start with shorter sequences — they have fewer possible positions',
      'Look for the most unique digit in a sequence as your anchor point'
    ],
    benefits: [
      'Enhances observation skills and visual scanning speed',
      'Improves number recognition and numerical literacy',
      'Develops sustained concentration and focused attention',
      'Provides effective brain training through pattern recognition',
      'Strengthens systematic thinking and search strategies',
      'Great for all ages — fun way to sharpen mental acuity'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'numbers', 'observation', 'patterns', 'brain-teaser', 'educational'],
    relatedGames: ['word-search', 'sudoku', 'sliding-numbers', 'mine-sweeper']
  },
  'tank-1990': {
    id: 'tank-1990',
    name: 'Tank 1990',
    emoji: '🪖',
    category: 'Arcade',
    description: 'Command your tank - destroy enemies and defend your base!',
    longDescription:
      'Tank 1990 is a classic battle game where you command a tank to destroy enemy tanks and defend your base. Navigate through destructible terrain with intelligent enemy AI patterns that challenge your tactical abilities. This retro-style game faithfully recreates the beloved Battle City experience with modern graphics, responsive controls, and strategic depth. Protect your base at all costs while systematically eliminating waves of enemy tanks across multiple levels.',
    features: [
      'Classic tank battle gameplay faithful to the original Battle City',
      'Destructible terrain — blast through walls to create new paths',
      'Intelligent enemy AI with varied movement and attack patterns',
      'Base defense objective — protect your eagle at all costs',
      'Multiple levels with unique terrain layouts and enemy configurations',
      'Retro-style pixel graphics with modern smooth rendering',
      'Power-up items: shields, speed boosts, stronger shots, freeze enemies',
      'Progressive difficulty with faster and smarter enemy tanks',
      'Different enemy tank types with varying speed and armor',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Use directional controls (swipe or D-pad) to move your tank',
      'Tap the fire button to shoot — destroy enemy tanks and walls',
      'Protect your base (eagle symbol) from enemy tanks at all costs',
      'Destroy all enemy tanks in each wave to advance to the next level',
      'Collect power-up items that appear when destroying special enemies',
      'Use terrain strategically — hide behind walls and create chokepoints',
      'If your base is destroyed, the game ends regardless of lives remaining'
    ],
    tips: [
      'Protect your base as the #1 priority — position yourself between enemies and the base',
      'Use destructible walls as cover — but be careful not to destroy your own defenses',
      'Prioritize enemies heading directly toward your base over distant ones',
      'Learn each enemy type: light tanks are fast, heavy tanks take multiple hits',
      'Collect star power-ups immediately — they upgrade your tank shots',
      'Create chokepoints in the terrain to funnel enemies into kill zones',
      'Balance between offensive pushes and defensive positioning near the base'
    ],
    benefits: [
      'Enhances strategic and tactical thinking',
      'Improves reaction time and multi-target prioritization',
      'Develops situational awareness and battlefield assessment',
      'Provides classic retro gaming nostalgia',
      'Strengthens quick decision-making under simultaneous threats',
      'Great for fans of classic arcade combat games'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone 10+',
    tags: ['arcade', 'battle', 'tanks', 'defense', 'retro', 'classic', 'action'],
    relatedGames: ['space-fighter', 'pac-man', 'car-racing', 'snake-3d']
  },
  'nuts-and-bolts': {
    id: 'nuts-and-bolts',
    name: 'Nuts and Bolts',
    emoji: '🔩',
    category: 'Puzzle',
    description: 'Unscrew bolts and remove planks - solve physics puzzles!',
    longDescription:
      'Nuts and Bolts is a physics-based puzzle game where you unscrew bolts and remove wooden planks to solve increasingly complex mechanical puzzles. Plan your moves carefully as each bolt removal affects the entire structure — planks shift, rotate, and fall based on realistic physics. The game challenges your logical thinking, spatial reasoning, and understanding of gravity and balance. With its satisfying unscrewing animations, clever level design, and the "aha!" moments of finding the right sequence, Nuts and Bolts provides a uniquely satisfying puzzle experience.',
    features: [
      'Physics-based puzzle mechanics with realistic gravity simulation',
      'Satisfying bolt unscrewing animations and sound effects',
      'Increasingly complex wooden plank structures to disassemble',
      'Realistic physics — planks pivot, slide, and fall naturally',
      'Multiple levels with unique structural challenges',
      'Strategic planning required — removal order matters',
      'Undo button for experimenting with different approaches',
      'Hint system for when you get stuck on a tough puzzle',
      'Progressive difficulty from simple to mind-bending',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap bolts to unscrew and remove them from the wooden planks',
      'Planks will shift, rotate, or fall when their bolts are removed',
      'Plan the order of bolt removal carefully — sequence matters',
      'Use physics to your advantage — let gravity do the work',
      'Clear all planks and bolts from the screen to complete each level',
      'Some bolts connect multiple planks — removing them affects the whole structure',
      'Use the undo button to try different removal sequences'
    ],
    tips: [
      'Study the entire structure before removing any bolts',
      'Remove bolts that support the fewest pieces first to simplify the structure',
      'Think about how gravity will affect remaining pieces after each removal',
      'Some puzzles require a very specific removal order — experiment patiently',
      'Shared bolts (connecting two planks) are key — plan their removal carefully',
      'Look for planks that are only held by a single bolt — those are easy wins',
      'If stuck, try removing bolts in a completely different order'
    ],
    benefits: [
      'Develops logical thinking and sequential reasoning',
      'Improves understanding of physics and mechanical principles',
      'Enhances spatial awareness and structural analysis',
      'Provides deeply satisfying puzzle-solving moments',
      'Strengthens planning skills through consequence prediction',
      'Great for all ages — intuitive mechanics with deep challenges'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'physics', 'mechanics', 'logic', 'brain-teaser', 'satisfying'],
    relatedGames: ['pipe-connect', 'colors-sort', 'block-blast', 'sliding-numbers']
  },
  'ludo-king': {
    id: 'ludo-king',
    name: 'Ludo King',
    emoji: '🎲',
    category: 'Strategy',
    description: 'Roll the dice and race your tokens home - classic board game!',
    longDescription:
      'Ludo King is the beloved classic board game where you roll dice and race your four tokens from start to home before your opponents. Play against smart AI opponents with strategic token movement, blocking tactics, and the thrill of the dice. This timeless family game offers fun for all ages with its simple rules yet surprising strategic depth. Choose which token to move, when to play safe, and when to take risks — every roll of the dice brings new opportunities and dangers.',
    features: [
      'Classic Ludo board game with authentic rules and gameplay',
      'Smart AI opponents with multiple difficulty levels',
      'Realistic dice rolling with physics animations',
      'Strategic token movement with capturing and blocking mechanics',
      'Four-player board with color-coded tokens and safe zones',
      'Clean, beautiful board design with smooth token animations',
      'Roll a 6 to bring tokens out of base and get bonus turns',
      'Safe spots on the board where tokens cannot be captured',
      'Score and win tracking across multiple games',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Roll the dice by tapping — your token moves forward that many spaces',
      'Roll a 6 to move a token out of your base onto the starting square',
      'Navigate your tokens clockwise around the board toward your home column',
      'Land on an opponent token to send it back to their base (capture!)',
      'Rolling a 6 gives you a bonus turn — use it wisely!',
      'Get all four of your tokens safely into your home column to win',
      'Tokens in safe spots (marked with stars) cannot be captured'
    ],
    tips: [
      'Spread your tokens across the board to maximize opportunities',
      'Use blocking positions to slow opponents — stack tokens on safe spots',
      'Prioritize getting tokens out of base when you roll a 6',
      'Be strategic about which token to move — sometimes defense beats offense',
      'Balance aggression (capturing opponents) and caution (avoiding captures)',
      "Don't leave tokens exposed near opponent positions — keep them safe",
      'Near the home stretch, be patient — you need exact rolls to finish'
    ],
    benefits: [
      'Develops strategic thinking and decision-making under uncertainty',
      'Improves probability understanding through dice-based gameplay',
      'Provides classic board game entertainment for families',
      'Teaches risk management and calculated risk-taking',
      'Enhances patience and sportsmanship through wins and losses',
      'Great for all ages — simple rules make it accessible to everyone'
    ],
    difficulty: 'Easy to Medium',
    ageRating: 'Everyone',
    tags: ['strategy', 'board', 'dice', 'classic', 'family', 'casual', 'nostalgic'],
    relatedGames: ['dots-and-boxes', 'tic-tac-toe', 'spider-solitaire', 'sudoku']
  },
  'spider-solitaire': {
    id: 'spider-solitaire',
    name: 'Spider Solitaire',
    emoji: '🃏',
    category: 'Puzzle',
    description: 'Build card sequences from King to Ace - classic solitaire!',
    longDescription:
      'Spider Solitaire is a classic card game where you build descending sequences from King to Ace on the tableau and clear them to win. Multiple suit difficulties (1, 2, or 4 suits) provide varying levels of challenge, from relaxing to fiendishly difficult. With its undo support, strategic depth, and the satisfying feeling of completing a full King-to-Ace sequence, Spider Solitaire is one of the most beloved card games worldwide. This timeless game challenges your planning, organizational skills, and ability to think many moves ahead.',
    features: [
      'Classic Spider Solitaire gameplay with authentic card mechanics',
      'Multiple difficulty levels: 1 suit (easy), 2 suits (medium), 4 suits (expert)',
      'Unlimited undo move support for strategic exploration',
      'Satisfying sequence completion animations when King-to-Ace is built',
      'Clean, elegant card designs with smooth drag-and-drop',
      'Score tracking with personal best records per difficulty',
      'Auto-reveal of face-down cards when columns are cleared',
      'Deal new row of cards from the stock when no moves are available',
      'Column management for strategic card organization',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Build descending card sequences (K, Q, J, 10, 9...) on the tableau columns',
      'Complete a full King-to-Ace sequence of the same suit to remove it from play',
      'Move single cards or in-suit sequences between columns to reveal hidden cards',
      'Tap the stock pile to deal one new card to each column when stuck',
      'Clear an empty column to use it as temporary workspace for rearranging',
      'Clear all 8 suit sequences (104 cards total) to win the game',
      'Use undo generously to explore different strategic paths'
    ],
    tips: [
      'Focus on uncovering face-down cards — revealing information is always valuable',
      'Build sequences of the same suit whenever possible — mixed suits break apart when moved',
      'Keep empty columns available for maneuvering — they are your most powerful tool',
      'Plan several moves ahead — short-term gains can create long-term problems',
      'Use undo wisely to test strategies before committing to a line of play',
      "Don't deal from the stock too early — explore all available moves first",
      'Prioritize organizing the deepest columns with the most hidden cards'
    ],
    benefits: [
      'Enhances strategic planning and forward thinking',
      'Improves organizational skills and pattern recognition',
      'Develops patience and methodical problem-solving',
      'Provides classic card game enjoyment and relaxation',
      'Strengthens sequential reasoning and decision-making',
      'Great for all ages — a timeless single-player card game'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'cards', 'solitaire', 'classic', 'strategy', 'relaxing'],
    relatedGames: ['sudoku', 'mine-sweeper', 'ludo-king', 'dots-and-boxes']
  },
  'maze-runner': {
    id: 'maze-runner',
    name: 'Maze Runner',
    emoji: '🧩',
    category: 'Puzzle',
    description: 'Navigate through procedural mazes - tilt and physics controls!',
    longDescription:
      'Maze Runner is a challenging puzzle game where you guide a ball through intricate procedurally generated mazes using tilt controls or touch gestures. The game features realistic physics-based ball movement, variable maze sizes from 8x8 to 12x12, and increasing complexity that tests your spatial navigation, motor control, and problem-solving abilities. With its smooth ball physics, satisfying maze completion, and infinite replay value from procedural generation, Maze Runner provides a uniquely immersive puzzle experience.',
    features: [
      'Procedurally generated mazes — infinite unique layouts every time',
      'Physics-based ball movement with realistic momentum and friction',
      'Dual control options: tilt your device or use touch swipe controls',
      'Multiple difficulty levels with varying maze complexity',
      'Various maze sizes from compact 8x8 to sprawling 12x12 grids',
      'Timer-based scoring for competitive play',
      'Smooth ball rolling animations with physics interactions',
      'Progressive difficulty with tighter corridors and more dead ends',
      'Path-finding challenge that tests spatial navigation skills',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tilt your device or swipe to roll the ball through the maze',
      'Navigate from the starting position to the exit marker',
      'Avoid dead ends — the ball follows maze corridors based on physics',
      'Control the ball momentum — gentle tilts for precise navigation',
      'Reach the exit to complete the maze and earn your time-based score',
      'Try larger maze sizes for greater challenge',
      'Complete mazes faster for better scores on the leaderboard'
    ],
    tips: [
      "Take your time at first — understanding the maze layout is more important than speed",
      'Learn to control ball momentum — gentle tilts prevent overshooting corridors',
      'Study the maze layout briefly before moving — identify the general path',
      'Use walls to slow down and make precise turns in tight corridors',
      'Practice tilt controls in easy mode before attempting harder difficulties',
      'When stuck at a junction, try the path that leads toward the exit direction',
      'Smaller mazes are great for practicing ball control before tackling larger ones'
    ],
    benefits: [
      'Improves spatial navigation and mental mapping abilities',
      'Enhances problem-solving skills through maze exploration',
      'Develops fine motor control with precision tilt navigation',
      'Provides satisfying puzzle completion with time-based challenge',
      'Strengthens spatial reasoning and directional awareness',
      'Great for all ages — intuitive controls with scalable difficulty'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'maze', 'physics', 'navigation', 'spatial', 'challenging'],
    relatedGames: ['pipe-connect', 'sliding-numbers', 'connect-em-all', 'sudoku']
  },
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    emoji: '❌',
    category: 'Strategy',
    description: 'Play classic X and O against smart AI - strategic thinking!',
    longDescription:
      'Tic Tac Toe is the timeless classic X and O strategy game powered by a smart minimax AI algorithm that provides the perfect challenge. Quick casual matches test your strategic thinking as you try to get three in a row while blocking your opponent. With its clean, minimalist interface, instant restarts, and the perfect blend of simplicity and strategic depth, Tic Tac Toe is the ideal game for quick mental exercises. Simple enough for young children to learn, yet deep enough to challenge players who understand advanced concepts like forks and center control.',
    features: [
      'Classic X and O gameplay on a 3x3 grid',
      'Smart AI powered by minimax algorithm — unbeatable on hardest difficulty',
      'Multiple AI difficulty levels from beginner to expert',
      'Quick match format — each game takes under a minute',
      'Clean, intuitive interface with satisfying X and O animations',
      'Win/loss/draw tracking across sessions',
      'Instant restart for rapid rematches',
      'Win line animation highlighting the winning combination',
      'Turn indicator showing whose move it is',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap any empty cell to place your X (you always go first)',
      'Get three of your marks in a row to win (horizontal, vertical, or diagonal)',
      'Block your opponent from completing their row of three',
      'Rows can be horizontal, vertical, or diagonal — all three directions count',
      'The game ends in a draw if all 9 cells are filled with no winner',
      'Think ahead to outmaneuver the AI and create winning opportunities',
      'Try different opening moves to explore various strategies'
    ],
    tips: [
      'Always take the center square if available — it connects to the most winning lines',
      'Corners are the next best choice — they connect to 3 possible winning lines',
      'Look for fork opportunities — positions where you create two ways to win simultaneously',
      'Block opponent forks early before they create an unstoppable double threat',
      'The first player has an advantage — use it wisely with strong opening moves',
      "Against perfect play, the game always draws — so focus on exploiting mistakes",
      'Start with the center, then take a corner — this creates the most fork opportunities'
    ],
    benefits: [
      'Develops strategic thinking and logical reasoning',
      'Improves pattern recognition for winning combinations',
      'Enhances forward planning through move anticipation',
      'Provides quick mental exercise in under a minute',
      'Teaches game theory concepts like forks and blocking',
      'Great for all ages — the quintessential introductory strategy game'
    ],
    difficulty: 'Easy',
    ageRating: 'Everyone',
    tags: ['strategy', 'classic', 'quick', 'logic', 'brain-teaser', 'casual'],
    relatedGames: ['dots-and-boxes', 'ludo-king', 'sudoku', 'spider-solitaire']
  },
  'car-racing': {
    id: 'car-racing',
    name: 'Car Racing',
    emoji: '🏎️',
    category: 'Action',
    description: 'Dodge traffic and race through lanes - test your reflexes!',
    longDescription:
      'Car Racing is a high-speed endless racing game that puts you behind the wheel navigating through busy multi-lane traffic. Dodge other vehicles, change lanes strategically, and push your speed to the limit while avoiding crashes. The game features smooth lane-switching controls, distance-based scoring, near-miss bonuses for daring maneuvers, and progressively increasing speed that tests your reflexes and nerve. With its realistic traffic patterns and satisfying driving mechanics, Car Racing delivers pure adrenaline-fueled excitement.',
    features: [
      'Fast-paced endless racing through multi-lane highway traffic',
      'Smooth lane-changing mechanics with responsive swipe controls',
      'Progressively increasing speed — the longer you survive, the faster it gets',
      'Distance-based scoring with personal best tracking',
      'Near-miss bonuses — score extra points for close calls with other vehicles',
      'Varied traffic patterns with cars, trucks, and buses of different speeds',
      'Multiple car designs and color themes to unlock',
      'Realistic traffic AI that creates challenging but fair scenarios',
      'Smooth 60fps graphics with highway scenery',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Swipe left or right to change lanes and dodge traffic',
      'Avoid crashing into other vehicles — one hit ends the game',
      'Drive as far as possible to maximize your distance score',
      'Pass close to other vehicles for near-miss bonus points',
      'Speed increases gradually — stay alert as it gets faster',
      'Beat your personal high score with each attempt',
      'Look ahead to plan lane changes before they become urgent'
    ],
    tips: [
      'Plan lane changes 2-3 vehicles ahead — anticipation beats reaction',
      'Use near-misses for bonus points, but only when you feel confident',
      "Don't stay in one lane too long — traffic clusters form and trap you",
      'Watch for traffic patterns — vehicles often come in waves with gaps between',
      'Stay focused at high speeds — the margin for error shrinks dramatically',
      'Trucks and buses are wider — give them extra clearance when passing',
      'The center lanes give you more escape options than the edges'
    ],
    benefits: [
      'Improves reaction time and reflexes through split-second decisions',
      'Enhances sustained focus and concentration during high-speed gameplay',
      'Develops anticipation and predictive skills through traffic reading',
      'Provides thrilling, adrenaline-pumping entertainment',
      'Strengthens quick decision-making under intense pressure',
      'Great for short gaming sessions — each run is fast and exciting'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['racing', 'action', 'cars', 'traffic', 'endless', 'fast-paced', 'reflex'],
    relatedGames: ['bike-racing', 'space-fighter', 'dino-jump', 'flappy-bird']
  },
  'bike-racing': {
    id: 'bike-racing',
    name: 'Bike Racing',
    emoji: '🏍️',
    category: 'Action',
    description: 'Race on motorcycles through traffic - faster and more intense!',
    longDescription:
      'Bike Racing takes the racing experience to the extreme with high-speed motorcycle action through dense highway traffic. Navigate your bike between vehicles with razor-thin margins, performing daring near-misses and hair-raising maneuvers for massive bonus points. Faster and more intense than car racing, Bike Racing tests the limits of your reflexes, nerve, and split-second decision-making. The narrower motorcycle profile allows for tighter gaps, but the higher speed makes every mistake fatal.',
    features: [
      'High-speed motorcycle racing through dense traffic',
      'Intense traffic navigation with razor-thin margins',
      'Tilt or touch controls — choose your preferred steering style',
      'Significantly faster pace than car racing for ultimate challenge',
      'Near-miss bonuses — weave between vehicles for massive score multipliers',
      'Competitive scoring with global leaderboards',
      'Speed boost system for daring players who maintain near-miss streaks',
      'Realistic bike physics with responsive handling',
      'Multiple motorcycle designs to unlock through high scores',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tilt your device or tap/swipe to steer the motorcycle left and right',
      'Weave through traffic carefully — crashes end the game instantly',
      'Perform near-misses by passing extremely close to vehicles for bonus points',
      'Maintain near-miss streaks for increasing score multipliers',
      'Drive as far and as fast as possible for the highest score',
      'Speed increases progressively — adapt your reaction timing accordingly',
      'Beat your personal best and compete on the global leaderboard'
    ],
    tips: [
      'Master the controls on easier sections before the speed ramps up',
      'Practice near-miss timing — the bonus points are massive but risky',
      'Stay between lanes when safe — it gives you the most escape options',
      'Anticipate traffic patterns — vehicles appear in predictable waves',
      'Stay calm at extreme speeds — panicking causes overcorrection',
      'The motorcycle is narrower than cars — you can fit through tighter gaps',
      'Build up near-miss streaks for exponential score multipliers'
    ],
    benefits: [
      'Dramatically improves reaction time and reflexes',
      'Enhances focus under extreme pressure and high speed',
      'Provides intense adrenaline-pumping entertainment',
      'Develops split-second decision-making abilities',
      'Strengthens hand-eye coordination with precise steering',
      'Perfect for thrill-seekers who love pushing their limits'
    ],
    difficulty: 'Hard',
    ageRating: 'Everyone',
    tags: ['racing', 'action', 'motorcycle', 'traffic', 'fast-paced', 'intense', 'reflex'],
    relatedGames: ['car-racing', 'space-fighter', 'dino-jump', 'flappy-bird']
  },
  'sliding-numbers': {
    id: 'sliding-numbers',
    name: 'Sliding Numbers',
    emoji: '🔢',
    category: 'Puzzle',
    description: 'Slide numbered tiles to arrange them in order - classic puzzle!',
    longDescription:
      'Sliding Numbers is a classic puzzle game that challenges your logical thinking and spatial reasoning. Slide numbered tiles on a grid to arrange them in sequential order using the single empty space as your maneuvering tool. Multiple grid sizes from easy 3x3 to challenging 5x5 provide varying difficulty levels. This timeless puzzle, also known as the 15 puzzle, has been challenging minds since the 1880s — and it remains one of the purest tests of spatial reasoning and sequential planning.',
    features: [
      'Classic sliding puzzle mechanics faithful to the original 15-puzzle',
      'Multiple grid sizes: 3x3 (easy), 4x4 (medium), and 5x5 (hard)',
      'Move counter tracking — solve in fewer moves for a better score',
      'Best time records for each grid size',
      'Clean, minimalist design with smooth sliding animations',
      'Undo move option for correcting mistakes',
      'Scramble button for instant new puzzle generation',
      'Progressive difficulty that grows with each grid size',
      'Satisfying completion animation when puzzle is solved',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap any tile adjacent to the empty space to slide it into the gap',
      'Rearrange all numbered tiles into sequential order (1, 2, 3, ...)',
      'The empty space should end up in the bottom-right corner',
      'Complete the puzzle with the fewest moves possible for the best score',
      'Challenge yourself with larger grids as your skills improve',
      'Use the undo button to reverse moves when you make a mistake',
      'The timer tracks your solving speed — compete against yourself!'
    ],
    tips: [
      'Solve the top row first, then work your way down row by row',
      'Plan 3-5 moves ahead — random sliding rarely leads to solutions',
      'Use the empty space strategically as a temporary holding position',
      "Don't undo too much — learning from mistakes builds pattern recognition",
      'Start with 3x3 grids to learn the fundamental techniques',
      'The last two rows should be solved together as a unit',
      'Practice the "corner technique" for placing tiles in the correct position'
    ],
    benefits: [
      'Improves logical thinking and sequential reasoning',
      'Enhances spatial reasoning and mental manipulation of objects',
      'Develops problem-solving skills through constraint-based puzzles',
      'Provides a satisfying classic puzzle challenge',
      'Strengthens planning abilities and forward thinking',
      'Great for all ages — one of the most timeless puzzles ever invented'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'sliding', 'numbers', 'logic', 'brain-teaser', 'classic'],
    relatedGames: ['game-2048', 'sudoku', 'maze-runner', 'block-blast']
  },
  'game-2048': {
    id: 'game-2048',
    name: '2048',
    emoji: '🎮',
    category: 'Puzzle',
    description: 'Merge matching tiles to reach 2048 - addictive number puzzle!',
    longDescription:
      '2048 is the incredibly addictive puzzle game where you slide numbered tiles on a 4x4 grid, merging matching numbers to create higher values. The goal is to reach the legendary 2048 tile, but you can continue far beyond for astronomical scores. With its clean, minimalist design, smooth animations, and the perfect balance of strategy and luck, 2048 has captivated hundreds of millions of players worldwide. Simple to understand but devilishly difficult to master — every move matters.',
    features: [
      'Addictive tile merging gameplay on a 4x4 grid',
      'Clean, beautiful minimalist design with color-coded tiles',
      'Smooth tile sliding and merging animations',
      'Undo move option for correcting critical mistakes',
      'High score tracking with personal best records',
      'Continue playing after reaching 2048 for higher tiles (4096, 8192...)',
      'Score system based on tile values created through merging',
      'New tile (2 or 4) spawns after each move — manage board space',
      'Satisfying moment when the golden 2048 tile appears',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Swipe in any direction (up, down, left, right) to move all tiles',
      'When two tiles with the same number collide, they merge into one tile with double the value',
      'After each swipe, a new tile (2 or 4) appears in a random empty cell',
      'Keep merging: 2→4→8→16→32→64→128→256→512→1024→2048!',
      'Reach the 2048 tile to win — then keep going for higher scores!',
      'The game ends when no more moves are possible (board full, no merges available)',
      'Use the undo button to reverse your last move when needed'
    ],
    tips: [
      'Keep your highest tile locked in a corner — never move it unless absolutely necessary',
      'Build numbers in a consistent direction, creating a "snake" pattern of descending values',
      "Don't move your highest tile without purpose — disrupting your layout is costly",
      'Plan 2-3 moves ahead to avoid filling the board without merge opportunities',
      'Focus on creating large merges rather than many small ones',
      'Avoid using the direction that moves your highest tile away from its corner',
      'When the board is nearly full, look for any merge opportunity to free up space'
    ],
    benefits: [
      'Enhances strategic thinking and forward planning',
      'Improves mathematical intuition through exponential growth',
      'Develops spatial planning and board management skills',
      'Provides highly addictive brain training that improves with practice',
      'Strengthens decision-making through consequence prediction',
      'Great for all ages — simple rules hide deep strategic complexity'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', '2048', 'merging', 'strategy', 'addictive', 'numbers'],
    relatedGames: ['sliding-numbers', 'block-blast', 'fruit-merger', 'colors-sort']
  },
  'snake-3d': {
    id: 'snake-3d',
    name: 'Snake 3D',
    emoji: '🐍',
    category: 'Arcade',
    description: 'Eat eggs to grow longer - avoid walls and your own tail!',
    longDescription:
      'Snake 3D is a modern take on the classic snake game that has entertained players for decades. Control a snake that grows longer each time it eats an egg. Navigate the playing field, collect eggs to grow, and avoid crashing into walls or your own increasingly long tail. With smooth, responsive controls, clean graphics, and progressive difficulty as your snake gets longer, Snake 3D is easy to pick up but increasingly challenging to master.',
    features: [
      'Classic snake gameplay with modern, clean graphics',
      'Smooth, responsive swipe controls for precise direction changes',
      'Progressive difficulty — the longer your snake, the harder it gets',
      'Score tracking with personal high score records',
      'Clean, colorful graphics with smooth snake movement',
      'Instant restart for quick retries after each crash',
      'Growing challenge as more of the board is occupied by your snake',
      'Satisfying eating animations and sound effects',
      'Multiple speed settings for different skill levels',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Swipe in any direction to change the snake heading',
      'Guide the snake to eat eggs that appear on the playing field',
      'Each egg eaten makes the snake grow one segment longer',
      'Avoid hitting the walls — that ends the game',
      'Avoid running into your own tail — the snake cannot cross itself',
      'Survive as long as possible to achieve the highest score',
      'The snake moves continuously — you only control the direction'
    ],
    tips: [
      'Plan your path several moves ahead — think about where you will be, not just where you are',
      'Stay in the center of the playing field when possible — it gives you the most options',
      "Don't trap yourself in corners or along edges — always leave an escape route",
      'Maintain steady, deliberate movements — erratic direction changes cause self-collisions',
      'As the snake grows longer, use wider turning arcs to avoid your own tail',
      'Learn to use the walls as boundaries without getting too close',
      'Practice makes perfect — you will develop spatial intuition over time'
    ],
    benefits: [
      'Improves spatial planning and path prediction',
      'Enhances reaction time and quick directional decisions',
      'Develops forward thinking and consequence anticipation',
      'Provides classic arcade fun with timeless appeal',
      'Strengthens spatial awareness as the playing field shrinks',
      'Great for all ages — the original casual game experience'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'snake', 'classic', 'retro', 'endless', 'casual'],
    relatedGames: ['pac-man', 'dino-jump', 'flappy-bird', 'tank-1990']
  },
  'perfect-circle': {
    id: 'perfect-circle',
    name: 'Perfect Circle',
    emoji: '⭕',
    category: 'Action',
    description: 'Draw the most perfect circle you can - test your precision!',
    longDescription:
      'Perfect Circle is a unique skill-based game that challenges you to draw the most perfect circle possible using just your finger. Trace a circle on the screen and receive a percentage score based on how close your drawing matches a mathematically perfect circle. The game tests your hand-eye coordination, steady hand control, and fine motor precision. Deceptively simple yet maddeningly difficult to perfect, this game will have you saying "just one more try" as you chase the elusive 100% score.',
    features: [
      'Unique precision drawing challenge unlike any other game',
      'Mathematically calculated accuracy scoring (0-100%)',
      'Real-time visual comparison between your circle and perfection',
      'Clean, minimalist design that puts focus on your drawing',
      'Instant feedback showing exactly where your circle deviated',
      'Personal best tracking — chase your highest percentage score',
      'Share your best scores and challenge friends',
      'Practice mode for warming up before serious attempts',
      'Calming experience despite the intense focus required',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Press and hold to start your circle drawing at any point',
      'Draw a complete circle in one continuous motion without lifting your finger',
      'Release your finger when you return to the starting point to complete the circle',
      'Receive your accuracy percentage score immediately',
      'The closer your drawing matches a perfect mathematical circle, the higher your score',
      'Try different circle sizes — some may suit your drawing style better',
      'Keep practicing to improve your muscle memory and consistency'
    ],
    tips: [
      'Draw at a steady, consistent speed — rushing or slowing down creates wobbles',
      'Use your whole arm for larger circles, not just your wrist — it gives smoother curves',
      'Practice with different circle sizes to find your sweet spot',
      'Stay relaxed — muscle tension in your hand and arm affects accuracy dramatically',
      'Find your optimal drawing speed — too fast loses control, too slow adds tremors',
      'Focus on the path ahead, not the line behind — look where you are going',
      'Take a deep breath before each attempt to steady your hand'
    ],
    benefits: [
      'Develops fine motor control and drawing precision',
      'Enhances hand-eye coordination through continuous feedback',
      'Provides a unique challenge that no other game offers',
      'Improves patience and concentration through focused drawing',
      'Strengthens body awareness and motor planning',
      'Perfect for creative types who enjoy precision challenges'
    ],
    difficulty: 'Hard',
    ageRating: 'Everyone',
    tags: ['action', 'skill', 'precision', 'drawing', 'challenge', 'unique'],
    relatedGames: ['knife-hit', 'stack-tower', 'color-switch', 'fruit-ninja']
  },
  sudoku: {
    id: 'sudoku',
    name: 'Sudoku',
    emoji: '🔟',
    category: 'Puzzle',
    description: 'Fill the 9x9 grid with numbers 1-9 - no repeats allowed!',
    longDescription:
      "Sudoku is the world's most popular number puzzle game, challenging millions of players daily. Fill every row, column, and 3x3 box with numbers 1-9 without repeating any digit. Starting with a partially filled grid, use pure logic and deduction to determine the correct number for each empty cell. No guessing is ever needed — every puzzle has a single unique solution that can be reached through careful reasoning. With multiple difficulty levels from gentle warm-ups to fiendishly hard expert puzzles, Sudoku provides endless brain-training entertainment.",
    features: [
      'Classic 9x9 Sudoku grid with authentic number puzzle gameplay',
      'Multiple difficulty levels: Easy, Medium, Hard, and Expert',
      'Error highlighting to catch mistakes immediately',
      'Clean, intuitive number input controls',
      'Note/pencil mark system for tracking candidate numbers',
      'Undo/redo support for exploring different strategies',
      'Unlimited procedurally generated puzzles — never run out',
      'Timer tracking for competitive solving',
      'Auto-save so you can continue puzzles later',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Fill each empty cell with a number from 1 to 9',
      'Each row must contain all numbers 1-9 without any repeats',
      'Each column must contain all numbers 1-9 without any repeats',
      'Each 3x3 box (9 total) must contain all numbers 1-9 without any repeats',
      'Use logic and deduction to determine the only possible number for each cell',
      'Use pencil marks to note candidate numbers for uncertain cells',
      'No guessing needed — every puzzle has exactly one logical solution'
    ],
    tips: [
      'Start with rows, columns, or boxes that have the most filled cells — fewer possibilities',
      'Look for naked singles — cells where only one number can possibly fit',
      'Scan rows and columns for hidden singles — a number that can only go in one place',
      'Use pencil marks to track possibilities, then eliminate candidates systematically',
      'Practice daily to dramatically improve your solving speed and pattern recognition',
      "Never guess — if you can't logically determine a number, look for easier cells first",
      'Learn advanced techniques (pointing pairs, box-line reduction) for harder puzzles'
    ],
    benefits: [
      'Improves logical reasoning and deductive thinking',
      'Enhances concentration, focus, and sustained attention',
      'Boosts working memory and pattern recognition abilities',
      'Provides excellent daily brain training backed by cognitive science',
      'Develops systematic thinking and elimination strategies',
      'Great for all ages — the ultimate pure logic puzzle'
    ],
    difficulty: 'Easy to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'numbers', 'logic', 'brain-teaser', 'classic', 'educational'],
    relatedGames: ['mine-sweeper', 'sliding-numbers', 'word-search', 'game-2048']
  },
  'block-breaker': {
    id: 'block-breaker',
    name: 'Block Breaker',
    emoji: '🧱',
    category: 'Arcade',
    description: 'Break bricks with a bouncing ball and paddle - classic arcade!',
    longDescription:
      'Block Breaker is a classic arcade game where you control a paddle at the bottom of the screen to bounce a ball upward and break all the bricks above. With power-ups that grant multi-ball, wider paddle, laser shots, and more, combined with progressively challenging brick formations and patterns, this timeless Breakout-style game tests your reflexes, precision, and strategic positioning. The satisfying moment when the ball clears a path through the bricks and bounces around destroying everything in its path is what makes Block Breaker endlessly entertaining.',
    features: [
      'Classic brick-breaking gameplay faithful to the Breakout/Arkanoid legacy',
      'Smooth ball physics and responsive paddle controls',
      'Multiple power-ups: multi-ball, wide paddle, laser, sticky ball, speed changes',
      'Colorful brick formations with bricks of different durability',
      'Progressive difficulty with increasingly complex brick patterns',
      'Satisfying brick destruction effects with particles and sounds',
      'High score tracking with personal best records',
      'Combo system for clearing multiple bricks in quick succession',
      'Boss bricks that take multiple hits to destroy',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Drag the paddle left and right at the bottom of the screen to bounce the ball',
      'Break all bricks on screen by hitting them with the ball to complete each level',
      'Catch power-up items that fall from broken bricks for special abilities',
      "Don't let the ball fall below the paddle — you lose a life if it does",
      'Aim for strategic angles to reach bricks in difficult positions',
      'Some bricks require multiple hits to break — they change color with each hit',
      'Use power-ups wisely — multi-ball is especially powerful for clearing levels'
    ],
    tips: [
      'Stay centered under the ball as much as possible for the best reaction time',
      'Aim for the corners of brick formations to get the ball bouncing above them',
      'Collect power-ups quickly before they fall off the bottom of the screen',
      'Multi-ball power-ups are the most valuable — they massively speed up clearing',
      'Be patient with the last few bricks — the ball angle becomes harder to control',
      'The angle of the ball depends on where it hits the paddle — use the edges for sharp angles',
      "When you have a clear path, let the ball bounce naturally rather than chasing it"
    ],
    benefits: [
      'Improves hand-eye coordination and tracking precision',
      'Enhances reflexes and reaction time through ball tracking',
      'Provides satisfying and classic arcade entertainment',
      'Develops spatial awareness and angle prediction',
      'Strengthens focus and concentration during fast gameplay',
      'Great for all ages — one of the most iconic arcade game genres'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'classic', 'brick-breaker', 'action', 'reflexes', 'retro'],
    relatedGames: ['balloon-blaster', 'flappy-bird', 'whack-a-mole', 'pac-man']
  },
  'knife-hit': {
    id: 'knife-hit',
    name: 'Knife Hit',
    emoji: '🔪',
    category: 'Action',
    description: "Throw knives at the spinning log - don't hit another knife or apple!",
    longDescription:
      'Knife Hit is a thrilling action game where you throw knives at a spinning wooden log. Time your throws carefully to avoid hitting knives already stuck in the log. Hit the apple targets for bonus points! With each level, the log spins faster and the challenge intensifies. This addictive game tests your timing, patience, and precision in a satisfying knife-throwing experience that keeps you coming back for "just one more round."',
    features: [
      'One-tap knife throwing with precise timing mechanics',
      'Spinning log with dynamic rotation patterns that change each level',
      'Apple targets for bonus points — risk vs reward decisions',
      'Progressive difficulty with faster rotations and more knives',
      'Satisfying knife-sticking mechanics with impact sound effects',
      'Offline play — no internet connection required',
      'Global leaderboards for competitive play',
      'Clean and polished visual design'
    ],
    howToPlay: [
      'Tap the screen to throw a knife at the spinning log',
      "Don't hit knives already stuck in the log — that ends the game",
      'Hit apple targets for bonus points when they appear on the log',
      'Use all your knives to complete each level and advance',
      'Time your throws between gaps in existing knives',
      'The log speeds up and rotation patterns change as you progress'
    ],
    tips: [
      'Watch the rotation pattern before throwing — timing is everything',
      'Time your throws for the widest gaps between existing knives',
      'Be patient — rushing leads to collisions and game over',
      'Apple bonuses are worth the extra risk if you time them well',
      'Focus on rhythm rather than aiming — develop a throwing cadence',
      'Practice timing on early levels before harder rotation patterns appear'
    ],
    benefits: [
      'Improves timing and precision through rhythmic gameplay',
      'Enhances patience and focused attention',
      'Develops rhythm and pattern recognition skills',
      'Provides exciting and addictive gameplay for quick sessions',
      'Strengthens impulse control — learning when NOT to throw'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['action', 'timing', 'precision', 'addictive', 'casual', 'reflexes'],
    relatedGames: ['fruit-ninja', 'balloon-blaster', 'whack-a-mole', 'flappy-bird']
  },
  'color-switch': {
    id: 'color-switch',
    name: 'Color Switch',
    emoji: '🌈',
    category: 'Arcade',
    description: 'Jump through matching color obstacles - time your taps to survive!',
    longDescription:
      "Color Switch is a fast-paced arcade game where you control a colored ball that must pass through obstacles matching its color. Tap to jump and time your moves perfectly to pass through the correct color segments of rotating obstacles. Collect color-switching stars to change your ball's color and navigate increasingly complex patterns. One wrong move and it's game over! With its vibrant colors, smooth animations, and addictive one-more-try gameplay, Color Switch is a modern arcade classic.",
    features: [
      'One-tap jump mechanics with color matching challenge',
      'Rotating color obstacles with dynamic, evolving patterns',
      "Color-switching stars that change your ball's color mid-play",
      'Progressive difficulty with increasingly complex obstacle designs',
      'Vibrant colors and smooth animations create stunning visual effects',
      'Offline play — no internet connection required',
      'Global leaderboards for competitive play',
      'Endless gameplay with procedurally generated obstacles'
    ],
    howToPlay: [
      'Tap to make the ball jump upward against gravity',
      "Pass through obstacle segments that match your ball's current color",
      "Collect color-switching stars to change your ball's color",
      'Avoid touching any obstacle segment of a different color — instant game over',
      'Time your jumps to pass through the matching color segment of rotating obstacles',
      'Score points for each obstacle successfully cleared'
    ],
    tips: [
      'Focus on the matching color segment, not the entire obstacle',
      'Wait for the right moment — patience is more important than speed',
      'Anticipate color changes when you see a star approaching',
      'Develop a rhythm for each type of rotating obstacle',
      'Stay calm under pressure for better timing and accuracy',
      'Practice the first few obstacles to build confidence before pushing for high scores'
    ],
    benefits: [
      'Improves color recognition and visual processing',
      'Enhances reflexes and reaction time significantly',
      'Develops patience and precise timing skills',
      'Provides exciting and challenging arcade gameplay',
      'Strengthens visual tracking of rotating patterns',
      'Perfect for quick arcade sessions and high score chasing'
    ],
    difficulty: 'Hard',
    ageRating: 'Everyone',
    tags: ['arcade', 'color', 'timing', 'reflexes', 'addictive', 'challenging'],
    relatedGames: ['flappy-bird', 'dino-jump', 'balloon-blaster', 'stack-tower']
  },
  'stack-tower': {
    id: 'stack-tower',
    name: 'Stack Tower',
    emoji: '🏗️',
    category: 'Arcade',
    description: 'Stack sliding blocks perfectly to build the tallest tower!',
    longDescription:
      "Stack Tower is an addictive arcade game where you stack sliding blocks on top of each other to build the tallest tower possible. Tap at the right moment to place each block — if you're off, the overhanging part gets cut off, making the next block smaller. Perfect placements are rewarded with bonus points and satisfying visual effects. With its clean visuals, satisfying gameplay, and the constant drive to build higher, Stack Tower is the perfect pick-up-and-play arcade experience.",
    features: [
      'One-tap stacking with precision timing challenge',
      'Sliding blocks that require perfect alignment for best results',
      'Perfect placement bonuses and combo system for consecutive perfects',
      'Progressive difficulty as the tower grows taller and timing gets tighter',
      'Satisfying visual and audio feedback for every placement',
      'Offline play — no internet connection required',
      'Global leaderboards for competitive play',
      'Clean, modern visual design with smooth animations'
    ],
    howToPlay: [
      'Tap to place the sliding block on top of the stack',
      'Align the block as precisely as possible with the block below',
      'Overhanging portions get cut off, making your next block smaller',
      'Perfect placements maintain the full block size and earn bonuses',
      'Game ends when the block becomes too small to stack',
      'Build the tallest tower for the highest score'
    ],
    tips: [
      'Focus on the edges of the blocks for precise alignment',
      'Tap slightly early rather than late — compensate for reaction delay',
      'Perfect placements keep your tower wide — aim for them consistently',
      'Stay calm as the tower gets taller — height anxiety causes rushed taps',
      'Develop a consistent rhythm for placing blocks at regular intervals',
      'Watch the sliding speed — it may change as you progress higher'
    ],
    benefits: [
      'Improves timing and hand-eye coordination',
      'Enhances focus and concentration under pressure',
      'Provides satisfying and addictive gameplay',
      'Develops precision and consistency under increasing difficulty',
      'Strengthens rhythm and timing awareness',
      'Perfect for quick gaming sessions'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'stacking', 'timing', 'precision', 'addictive', 'casual'],
    relatedGames: ['block-breaker', 'color-switch', 'flappy-bird', 'balloon-blaster']
  },
  'mine-sweeper': {
    id: 'mine-sweeper',
    name: 'Mine Sweeper',
    emoji: '💣',
    category: 'Puzzle',
    description: 'Reveal all safe cells without hitting a hidden mine!',
    longDescription:
      'Mine Sweeper is the iconic logic puzzle game where you must uncover all safe cells on a grid without triggering any hidden mines. Use numbered clues that indicate how many mines surround each cell to deduce safe cells and flag dangerous ones. With careful logic and deduction, clear the entire minefield to win. A classic brain-teaser that has challenged millions for decades, Minesweeper is one of the purest tests of logical reasoning ever created.',
    features: [
      'Classic Minesweeper gameplay with logical deduction mechanics',
      'Tap to reveal cells, long-press to flag mines',
      'Numbered clues for deductive reasoning — each number tells you exactly how many mines are adjacent',
      'Multiple difficulty levels and grid sizes for all skill levels',
      'Clean, modern interface with intuitive touch controls',
      'Offline play — no internet connection required',
      'Global leaderboards for competitive play',
      'First-click safety — you never hit a mine on your first tap'
    ],
    howToPlay: [
      'Tap a cell to reveal it — if it has a number, that many mines surround it',
      'Numbers show how many of the 8 surrounding cells contain mines',
      'Long-press to flag a cell you think contains a mine',
      'Use logic to deduce which cells are safe based on the number clues',
      'Reveal all non-mine cells to win the game',
      'If you reveal a cell with a mine, the game is over',
      'Empty cells (no adjacent mines) automatically reveal their neighbors'
    ],
    tips: [
      'Start by revealing cells near the edges or corners — they have fewer neighbors',
      'Use flags to mark confirmed mine locations — it helps track your deductions',
      'Count carefully — the numbers never lie, always trust the math',
      'Look for patterns: a "1" next to a single unrevealed cell means that cell is a mine',
      'If stuck, look for cells that must be safe through process of elimination',
      'Practice with easier difficulties to learn common number patterns',
      'The "1-2-1" pattern along an edge is one of the most common solvable configurations'
    ],
    benefits: [
      'Enhances logical reasoning and deductive thinking',
      'Improves pattern recognition through number analysis',
      'Develops critical thinking and elimination strategies',
      'Provides deeply satisfying puzzle-solving moments',
      'Boosts concentration and attention to detail',
      'Perfect for brain training — one of the purest logic games'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'logic', 'classic', 'brain-teaser', 'strategy', 'deduction'],
    relatedGames: ['sudoku', 'word-search', 'number-search', 'sliding-numbers']
  },
  'snakes-and-ladders': {
    id: 'snakes-and-ladders',
    name: 'Snakes and Ladders',
    emoji: '🐍',
    category: 'Strategy',
    description: 'Classic board game - roll the dice, climb ladders, and avoid snakes to reach 100!',
    longDescription:
      'Snakes and Ladders is one of the most beloved classic board games in history, brought to life on your mobile device with stunning visuals and smooth animations. Roll the dice, move your token across a beautifully illustrated 10×10 board, climb ladders to leap ahead, and watch out for sneaky snakes that slide you back down. Play against a smart AI opponent that makes strategic moves. The game faithfully recreates the excitement, anticipation, and unpredictability of the original board game with colorful snakes, detailed wooden ladders, and 3D pawn tokens.',
    features: [
      'Classic Snakes and Ladders board game with authentic rules',
      'Beautiful 10×10 board with colorful pastel cells and realistic details',
      'Unique hand-drawn snakes with individual color patterns and personalities',
      '3D wooden ladders with realistic wood grain textures',
      'Smooth dice rolling animation with bounce physics',
      '3D pawn token pieces with glossy finish',
      'Smart AI opponent that plays strategically',
      'Score tracking based on moves taken and position reached',
      'Satisfying sound effects and haptic feedback',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Tap the dice to roll and move your token forward by that number',
      'Land on a ladder base to climb up and skip ahead on the board',
      "Land on a snake head and slide down to the snake's tail",
      'Roll a 6 to get a bonus turn — use it wisely!',
      'Rolling three 6s in a row incurs a penalty — be careful!',
      'Race against the AI to be the first to reach position 100',
      'You must roll the exact number needed to land on 100 to win'
    ],
    tips: [
      "There's no strategy for dice rolls, but enjoy the anticipation of each turn",
      'Watch for clusters of ladders in certain board areas — lucky streaks happen!',
      'Learn where the snake heads are to appreciate when you narrowly avoid them',
      'The endgame requires an exact roll to land on 100 — patience is key',
      'A single ladder can change the entire game — never give up!',
      'Rolling a 6 gives you an extra turn — the best rolls come in pairs',
      'The game teaches that setbacks (snakes) are temporary — ladders are always ahead'
    ],
    benefits: [
      'Teaches children about numbers, counting, and board game rules',
      'Develops patience and sportsmanship through wins and setbacks',
      'Provides family-friendly entertainment for all ages',
      'Helps with number recognition (1-100) for young learners',
      'Teaches resilience — snakes are setbacks, ladders are comebacks',
      'Great for quick gaming sessions — each game takes 3-5 minutes'
    ],
    difficulty: 'Easy',
    ageRating: 'Everyone',
    tags: ['strategy', 'board-game', 'classic', 'dice', 'family', 'casual', 'nostalgic'],
    relatedGames: ['ludo-king', 'tic-tac-toe', 'dots-and-boxes', 'perfect-circle']
  },
  'find-different-number': {
    id: 'find-different-number',
    name: 'Find Different Number',
    emoji: '🔍',
    category: 'Puzzle',
    description: 'Spot the odd numbers hiding in a 10×10 grid - sharp eyes win!',
    longDescription:
      'Find Different Number is a fast-paced visual puzzle game that tests your observation skills and attention to detail. A 10×10 grid is filled with 100 numbers that all look nearly identical — but 5 of them are slightly different digits cleverly disguised among similar-looking numbers. Your mission is to find all 5 different numbers before the timer runs out. The game uses visually similar digit pairs (like 6 and 8, or 1 and 7) to create a genuinely challenging visual search experience.',
    features: [
      '10×10 grid with 100 numbers to scan',
      '5 hidden different numbers to find each round',
      'Visually similar digit pairs for genuine challenge (6/8, 1/7, 3/9, etc.)',
      'Timer-based gameplay for exciting pressure',
      'Score system: 500 points per correct find',
      'Time bonus: 50 points × remaining seconds on completion',
      'Wrong taps are highlighted to help you learn',
      'Clean and colorful grid design with smooth animations',
      'Quick 1-2 minute rounds — perfect for short breaks',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Look at the 10×10 grid filled with numbers',
      'Most numbers are the same digit — find the 5 that are different',
      'Tap a number you think is different to select it',
      'Correct finds are highlighted in green and earn 500 points',
      'Wrong taps are marked in red — be careful!',
      'Find all 5 different numbers before time runs out to win',
      'Faster completion earns you a time bonus'
    ],
    tips: [
      'Scan the grid systematically — row by row or column by column',
      'Learn which digits look similar: 6/8, 1/7, 3/9, 5/6, 0/8',
      'Focus on the shapes of the numbers rather than reading them',
      'Start from the corners and edges where differences stand out more',
      "Don't rush — accuracy matters more than speed for scoring",
      'Practice improves your visual discrimination dramatically',
      'Take a deep breath and relax your eyes — strained eyes miss more'
    ],
    benefits: [
      'Sharpens visual discrimination and attention to detail',
      'Improves observation skills and visual scanning speed',
      'Enhances concentration and focused attention',
      'Provides quick brain training in 1-2 minute sessions',
      'Develops pattern recognition abilities',
      'Great for all ages — especially beneficial for cognitive sharpness'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'observation', 'numbers', 'brain-teaser', 'visual', 'quick', 'casual'],
    relatedGames: ['number-search', 'word-search', 'sudoku', 'mine-sweeper']
  },
  arrows: {
    id: 'arrows',
    name: 'Arrows',
    emoji: '➡️',
    category: 'Puzzle',
    description: 'Tap arrows to fly them off the board - clear them all before time runs out!',
    longDescription:
      "Arrows is a clever logic puzzle game where the board is filled with arrows pointing in different directions — up, down, left, and right. Your goal is to tap arrows to send them flying off the edge of the board in their pointed direction, but there's a catch: an arrow can only leave if its path to the edge is completely clear. Blocked arrows shake to tell you they can't move yet. By removing arrows strategically, you open paths for other arrows, creating a satisfying chain of clears.",
    features: [
      'Unique arrow-clearing puzzle mechanics',
      'Grid filled with directional arrows (up, down, left, right)',
      'Satisfying swoosh animations when arrows fly off the board',
      'Shake feedback for blocked arrows — clear visual guidance',
      "Never-stuck design — there's always a valid move available",
      'Timer-based gameplay for exciting pressure',
      'Score tracking based on speed and efficiency',
      'Clean and modern visual design with smooth animations',
      'Progressive difficulty with larger and more complex grids',
      'Offline play — no internet connection required'
    ],
    howToPlay: [
      'Look at the grid of arrows — each points up, down, left, or right',
      'Tap an arrow to send it flying in its direction toward the board edge',
      'An arrow can only leave if no other arrows block its path to the edge',
      "Blocked arrows shake to tell you they can't move yet",
      'Remove blocking arrows first to open paths for others',
      'Clear every single arrow from the board before time runs out',
      'Think ahead — removing one arrow opens new paths for others'
    ],
    tips: [
      'Start with arrows on the edges that have clear paths to leave',
      "Look for arrows pointing toward the nearest edge — they're most likely unblocked",
      'Work from the outside in — edge arrows are usually easier to clear first',
      'When stuck, look for the arrow closest to its target edge with fewest blockers',
      'Removing one arrow often unblocks several others — look for chain opportunities',
      "Don't overthink — tap quickly when you spot a clear path",
      'The puzzle guarantees at least one valid move at all times'
    ],
    benefits: [
      'Develops logical thinking and spatial reasoning',
      'Improves visual scanning and path-finding skills',
      'Enhances strategic planning and sequential thinking',
      'Provides satisfying puzzle-solving moments',
      'Boosts cognitive flexibility and mental agility',
      'Perfect for quick brain training sessions'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'logic', 'spatial', 'brain-teaser', 'strategy', 'casual', 'unique'],
    relatedGames: ['sliding-numbers', 'pipe-connect', 'colors-sort', 'block-blast']
  },
  'pipe-connect': {
    id: 'pipe-connect',
    name: 'Pipe Connect',
    emoji: '🔧',
    category: 'Puzzle',
    description: 'Rotate pipes to connect water flow from source to sink!',
    longDescription:
      'Pipe Connect is a satisfying puzzle game where you rotate pipe segments on a grid to create a continuous path from the water source to the sink. Each pipe piece can be rotated by tapping, and you must connect them all before time runs out. With increasingly complex layouts, multiple pipe types (straight, curved, T-junctions), and the satisfying moment when water flows through your completed network, Pipe Connect challenges your spatial thinking and problem-solving skills in a uniquely rewarding way.',
    features: [
      'Tap-to-rotate pipe puzzle mechanics — simple and intuitive',
      'Connect water flow from source to sink by aligning all pipes',
      'Progressively challenging grid layouts with more pipes and complexity',
      'Multiple pipe types including straight, curved, T-junctions, and cross pipes',
      'Timed gameplay for added challenge and competitive scoring',
      'Offline play — no internet connection required',
      'Global leaderboards for competitive play',
      'Satisfying water flow animation when the path is completed'
    ],
    howToPlay: [
      'Tap a pipe segment to rotate it 90 degrees clockwise',
      'Connect all pipes to create a continuous path from the source to the sink',
      'Every pipe on the grid must be part of the connected flow',
      'Create a path without any leaks or disconnected segments',
      'Complete the connection before the timer runs out',
      'Plan your rotations before tapping for maximum efficiency'
    ],
    tips: [
      'Start from the source and work your way toward the sink',
      'Look for pipes that can only connect one way — solve those first',
      'Edge and corner pipes have limited rotation options — they are easiest to solve',
      'Plan your complete path mentally before rotating pipes randomly',
      'T-junction pipes connect three directions — use them wisely at intersections',
      'Practice recognizing common pipe connection patterns for faster solving'
    ],
    benefits: [
      'Enhances spatial reasoning and visualization abilities',
      'Improves problem-solving through connection planning',
      'Develops planning and strategic thinking skills',
      'Provides satisfying puzzle-solving moments with visual reward',
      'Boosts logical thinking through constraint-based challenges',
      'Perfect for relaxing brain training sessions'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'logic', 'pipe', 'spatial', 'brain-teaser', 'relaxing'],
    relatedGames: ['maze-runner', 'colors-sort', 'sudoku', 'nuts-and-bolts']
  }
};

export const GAMES_LIST = Object.values(gamesData);
