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
      'Offline play support - no internet required'
    ],
    howToPlay: [
      'Drag and drop blocks from the bottom panel onto the grid',
      'Create complete horizontal or vertical lines to clear them',
      'Plan ahead to maximize space and create combos',
      'Clear multiple lines simultaneously for bonus points',
      'Game ends when no more blocks can be placed'
    ],
    tips: [
      'Always keep the center of the board clear for flexibility',
      'Try to clear multiple lines at once for massive bonus points',
      "Don't rush - take time to plan your moves strategically",
      'Save space for larger block pieces by clearing lines early',
      'Focus on creating opportunities for future moves'
    ],
    benefits: [
      'Improves spatial awareness and visual perception',
      'Enhances strategic thinking and planning skills',
      'Boosts problem-solving abilities',
      'Provides stress relief and relaxation',
      'Sharpens concentration and focus'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'strategy', 'block', 'brain-teaser', 'addictive'],
    relatedGames: ['bubble-shooter', 'candy-crush', 'game-2048', 'colors-sort']
  },
  'connect-em-all': {
    id: 'connect-em-all',
    name: 'Connect Em All',
    emoji: '🔗',
    category: 'Puzzle',
    description: 'Connect matching colored dots on the board to score points!',
    longDescription:
      'Connect Em All is a brain-teasing puzzle game where you draw paths between same-colored dots on the board. Connect matching colored dots without crossing lines to solve each puzzle. The game challenges your logical thinking and spatial reasoning as you work to connect all dots on increasingly complex grids.',
    features: [
      'Draw paths between matching colored dots',
      'Challenging grid layouts with increasing complexity',
      'Multiple difficulty levels',
      'Clean and intuitive touch controls',
      'No time pressure - think carefully',
      'Offline play support'
    ],
    howToPlay: [
      'Tap and drag to draw paths between same-colored dots',
      'Paths cannot cross each other',
      'Fill the entire board to complete each puzzle',
      'Plan your routes carefully to avoid blocking other connections',
      'Complete puzzles with fewer moves for better scores'
    ],
    tips: [
      'Start with dots that are far apart first',
      'Plan the overall layout before drawing',
      'Use the edges of the board for longer connections',
      'If stuck, try a different starting pair',
      'Keep paths as short as possible to leave room'
    ],
    benefits: [
      'Enhances logical thinking and spatial reasoning',
      'Improves planning and foresight',
      'Develops pattern recognition skills',
      'Provides relaxing puzzle-solving moments'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'colors', 'paths', 'logic', 'brain'],
    relatedGames: ['colors-sort', 'pipe-connect', 'maze-runner']
  },
  'bubble-shooter': {
    id: 'bubble-shooter',
    name: 'Bubble Shooter',
    emoji: '🫧',
    category: 'Puzzle',
    description: 'Match 3+ bubbles of the same color - classic puzzle fun!',
    longDescription:
      'Bubble Shooter is a timeless puzzle game that has captivated players for generations. Aim and shoot colored bubbles to create groups of three or more matching bubbles to pop them. The game combines precision aiming with strategic planning as you work to clear the screen before the bubbles reach the bottom.',
    features: [
      'Classic bubble shooting mechanics',
      'Colorful bubble designs',
      'Precision aiming system',
      'Power-ups and special bubbles',
      'Relaxing gameplay experience',
      'Score tracking and high scores'
    ],
    howToPlay: [
      'Aim your bubble shooter at the cluster of bubbles above',
      'Tap or click to shoot the bubble',
      'Match 3 or more bubbles of the same color to pop them',
      'Clear all bubbles to complete the level',
      'Use walls to bounce shots for tricky angles'
    ],
    tips: [
      'Look for large clusters of same-colored bubbles',
      'Use bank shots off walls for difficult angles',
      'Clear bubbles from the top to drop multiple groups',
      'Plan several moves ahead',
      'Save special bubbles for challenging situations'
    ],
    benefits: [
      'Improves aim and precision',
      'Enhances strategic planning',
      'Provides relaxing gameplay',
      'Develops color pattern recognition'
    ],
    difficulty: 'Easy to Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'bubble', 'match-3', 'casual', 'relaxing'],
    relatedGames: ['candy-crush', 'block-blast', 'colors-sort']
  },
  'tile-home': {
    id: 'tile-home',
    name: 'Tile Home',
    emoji: '🀄',
    category: 'Puzzle',
    description: 'Match 3 tiles of the same type in this mahjong-style puzzle!',
    longDescription:
      'Tile Home is a mahjong-style puzzle game where you clear stacked layers of tiles by finding and matching three tiles of the same type. Tap tiles to collect them and match triplets before your collection area fills up. The game challenges your observation skills and strategic thinking with beautifully designed tile layouts.',
    features: [
      'Mahjong-style tile matching gameplay',
      'Beautifully designed tile layouts',
      'Multiple levels with increasing complexity',
      'Strategic tile selection required',
      'Clean and intuitive interface',
      'Offline play support'
    ],
    howToPlay: [
      'Tap tiles to collect them into your holding area',
      'Match 3 identical tiles to clear them',
      'Clear all tiles on the board to win',
      'Your holding area can only hold 7 tiles',
      'Game over if the holding area fills up without a match'
    ],
    tips: [
      'Look for tiles that are easy to access first',
      'Plan ahead to avoid blocking important tiles',
      'Keep your holding area as empty as possible',
      'Focus on matching one tile type at a time',
      'Scan the entire board before making moves'
    ],
    benefits: [
      'Improves observation and pattern recognition',
      'Enhances strategic planning',
      'Develops visual scanning skills',
      'Provides relaxing puzzle solving'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'mahjong', 'matching', 'tiles', 'timed'],
    relatedGames: ['candy-crush', 'block-blast', 'connect-em-all']
  },
  'fruit-ninja': {
    id: 'fruit-ninja',
    name: 'Fruit Ninja',
    emoji: '🍎',
    category: 'Action',
    description: 'Slice flying fruits with finger swipes and combos - avoid the bombs!',
    longDescription:
      'Fruit Ninja is an exhilarating action game that tests your reflexes and hand-eye coordination. Slice through a variety of colorful fruits as they fly across the screen while carefully avoiding dangerous bombs. The game features satisfying slicing mechanics, combo multipliers, and special fruit that grant bonus points.',
    features: [
      'Fast-paced fruit slicing action',
      'Combo system for higher scores',
      'Special fruits with bonus effects',
      'Smooth and responsive controls',
      'Vibrant graphics and animations',
      'Achievement challenges'
    ],
    howToPlay: [
      'Swipe across fruits to slice them',
      'Slice multiple fruits in one swipe for combos',
      'Avoid slicing bombs - they end your game',
      "Don't let fruits fall off screen without slicing",
      'Collect special fruits for power-ups and bonuses'
    ],
    tips: [
      'Use quick, precise swipes for better control',
      'Watch for bomb patterns and avoid them',
      'Create combos by slicing multiple fruits at once',
      'Focus on critical fruits when screen gets crowded',
      'Practice different swiping techniques for efficiency'
    ],
    benefits: [
      'Improves hand-eye coordination',
      'Enhances reflexes and reaction time',
      'Provides exciting and satisfying gameplay',
      'Develops focus under pressure'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['action', 'arcade', 'reflex', 'fruit', 'slicing'],
    relatedGames: ['balloon-blaster', 'whack-a-mole', 'knife-hit']
  },
  'fruit-merger': {
    id: 'fruit-merger',
    name: 'Fruit Merger',
    emoji: '🍉',
    category: 'Puzzle',
    description: 'Drop and merge fruits to create bigger ones - reach the watermelon!',
    longDescription:
      'Fruit Merger is a delightful physics-based puzzle game where you drop fruits into a container and merge matching fruits to create larger ones. Start with small cherries and work your way up to the ultimate goal: the watermelon! The game features realistic physics, satisfying merge mechanics, and strategic depth as you manage space in the container.',
    features: [
      'Physics-based fruit dropping',
      'Satisfying merge mechanics',
      'Cute fruit designs',
      'Strategic space management',
      'Progressive fruit evolution',
      'High score challenges'
    ],
    howToPlay: [
      'Tap to drop fruits into container',
      'Matching fruits merge into larger ones',
      'Manage space carefully',
      'Reach watermelon for maximum points',
      'Game ends if fruits overflow'
    ],
    tips: [
      'Plan drop positions carefully',
      'Try to merge fruits quickly',
      'Keep larger fruits at the bottom',
      "Don't let fruits pile up unevenly",
      'Use physics to your advantage'
    ],
    benefits: [
      'Develops strategic thinking',
      'Enhances spatial awareness',
      'Provides relaxing casual gameplay',
      'Improves planning skills'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'merging', 'physics', 'fruit', 'casual'],
    relatedGames: ['game-2048', 'block-blast', 'candy-crush']
  },
  'flappy-bird': {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    emoji: '🐦',
    category: 'Arcade',
    description: 'Tap to flap and navigate through pipes - classic arcade challenge!',
    longDescription:
      "Flappy Bird is the legendary arcade game that became a global phenomenon. Guide a bird through a series of pipes by tapping the screen to make it flap its wings. The simple one-touch control belies the game's challenging nature, requiring precise timing and quick reflexes.",
    features: [
      'Classic one-touch gameplay',
      'Retro pixel art graphics',
      'Challenging pipe navigation',
      'High score tracking',
      'Instant restart for quick retries',
      'Simple but addictive mechanics'
    ],
    howToPlay: [
      'Tap the screen to make the bird flap',
      'Navigate through gaps between pipes',
      'Avoid touching pipes or the ground',
      'Each pipe passed earns one point',
      'Try to beat your high score'
    ],
    tips: [
      'Tap gently for small adjustments',
      'Maintain a steady rhythm',
      'Stay calm and focused',
      'Learn the timing between taps',
      "Practice makes perfect - don't give up!"
    ],
    benefits: [
      'Improves timing and reflexes',
      'Enhances focus and concentration',
      'Provides classic arcade challenge',
      'Develops patience and persistence'
    ],
    difficulty: 'Hard',
    ageRating: 'Everyone',
    tags: ['arcade', 'flappy', 'reflex', 'challenging', 'retro'],
    relatedGames: ['dino-jump', 'color-switch', 'stack-tower']
  },
  'dino-jump': {
    id: 'dino-jump',
    name: 'Dino Jump',
    emoji: '🦖',
    category: 'Arcade',
    description: 'Jump over obstacles and collect stars for lives - endless runner!',
    longDescription:
      'Dino Jump is an exciting endless runner game featuring a cute dinosaur on an adventure. Jump over obstacles, collect stars for extra lives, and see how far you can go in this fast-paced arcade experience. The game features smooth animations, progressively increasing difficulty, and a charming prehistoric theme.',
    features: [
      'Endless runner gameplay',
      'Cute dinosaur character',
      'Collectible stars for extra lives',
      'Increasing speed and difficulty',
      'Simple one-touch controls',
      'High score tracking'
    ],
    howToPlay: [
      'Tap to make the dinosaur jump',
      'Jump over obstacles and gaps',
      'Collect stars to earn extra lives',
      'Survive as long as possible',
      'Beat your previous high score'
    ],
    tips: [
      'Time your jumps carefully',
      'Collect stars whenever safe to do so',
      'Learn obstacle patterns',
      'Stay focused as speed increases',
      'Practice timing for double jumps'
    ],
    benefits: [
      'Improves timing and reflexes',
      'Enhances focus and concentration',
      'Provides exciting endless challenge',
      'Develops pattern recognition'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'runner', 'dinosaur', 'jumping', 'endless'],
    relatedGames: ['flappy-bird', 'car-racing', 'bike-racing']
  },
  'dots-and-boxes': {
    id: 'dots-and-boxes',
    name: 'Dots and Boxes',
    emoji: '⬜',
    category: 'Strategy',
    description: 'Connect dots to complete boxes and claim territory!',
    longDescription:
      'Dots and Boxes is a classic strategy game where you connect dots to complete boxes and claim territory. Play against a smart AI opponent that adapts to your play style. Plan your moves carefully to claim more boxes than your opponent in this timeless strategy challenge.',
    features: [
      'Classic dots and boxes gameplay',
      'Smart AI opponent',
      'Turn-based strategy',
      'Multiple grid sizes',
      'Score tracking',
      'Clean interface'
    ],
    howToPlay: [
      'Draw a line between two adjacent dots',
      'Complete the fourth side of a box to claim it',
      'Claimed boxes earn you points',
      'Player with more boxes wins',
      'Plan ahead to avoid giving boxes to your opponent'
    ],
    tips: [
      'Avoid completing the third side of a box for your opponent',
      'Force your opponent into giving you chains of boxes',
      'Control the center of the board',
      'Think several moves ahead',
      'Learn to sacrifice small chains for bigger ones'
    ],
    benefits: [
      'Enhances strategic thinking',
      'Improves planning and foresight',
      'Develops competitive skills',
      'Provides classic board game fun'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['strategy', 'AI', 'turn-based', 'territory', 'classic'],
    relatedGames: ['tic-tac-toe', 'ludo-king', 'sudoku']
  },
  'candy-crush': {
    id: 'candy-crush',
    name: 'Candy Crush',
    emoji: '🍬',
    category: 'Puzzle',
    description: 'Match colorful candies in rows to score points - sweet puzzle fun!',
    longDescription:
      "Candy Crush is a delightful match-3 puzzle game filled with colorful candies and sweet challenges. Swap adjacent candies to create matches of three or more, triggering satisfying cascades and special candy combinations. The game features strategic depth and vibrant graphics that provide hours of entertainment.",
    features: [
      'Classic match-3 gameplay',
      'Special candy power-ups',
      'Cascade combos for bonus points',
      'Colorful and appealing graphics',
      'Strategic gameplay elements',
      'Various level objectives'
    ],
    howToPlay: [
      'Swap adjacent candies to create matches',
      'Match 3 or more candies of the same color',
      'Create special candies with 4+ matches',
      'Complete level objectives before running out of moves',
      'Use power-ups strategically for tough levels'
    ],
    tips: [
      'Look for opportunities to create special candies',
      'Plan moves to create cascades',
      'Save power-ups for difficult situations',
      'Focus on level objectives, not just high scores',
      'Match candies at the bottom to create cascades'
    ],
    benefits: [
      'Improves pattern recognition',
      'Enhances strategic planning',
      'Provides satisfying puzzle solving',
      'Develops color awareness'
    ],
    difficulty: 'Easy to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'match-3', 'candy', 'casual', 'colorful'],
    relatedGames: ['bubble-shooter', 'block-blast', 'tile-home']
  },
  'whack-a-mole': {
    id: 'whack-a-mole',
    name: 'Whack A Mole',
    emoji: '🐱',
    category: 'Arcade',
    description: 'Whack cute cats popping from holes - test your lightning reflexes!',
    longDescription:
      'Whack A Mole is a fast-paced arcade game that tests your reflexes and hand-eye coordination. Cute cats pop up from various holes, and your job is to tap them before they disappear. The game features multiple difficulty levels, special bonus cats, and increasingly challenging patterns.',
    features: [
      'Fast-paced reflex gameplay',
      'Cute cat characters',
      'Multiple difficulty levels',
      'Special bonus cats',
      'Increasing speed challenges',
      'Score multipliers'
    ],
    howToPlay: [
      'Tap cats as they pop up from holes',
      'Score points for each successful whack',
      'Avoid missing too many cats',
      'Hit special cats for bonus points',
      'Survive as long as possible'
    ],
    tips: [
      'Stay focused on the entire board',
      'Develop quick tapping reflexes',
      'Prioritize special bonus cats',
      "Don't panic when speed increases",
      'Practice to improve reaction time'
    ],
    benefits: [
      'Improves reflexes and reaction time',
      'Enhances hand-eye coordination',
      'Provides exciting arcade fun',
      'Develops focus under pressure'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'reflex', 'whack-a-mole', 'cats', 'fast-paced'],
    relatedGames: ['balloon-blaster', 'fruit-ninja', 'popit-fidget']
  },
  'pac-man': {
    id: 'pac-man',
    name: 'Pac-Man',
    emoji: '👾',
    category: 'Arcade',
    description: 'Navigate the maze eating dots while avoiding ghosts!',
    longDescription:
      'Pac-Man is the legendary arcade game where you navigate a maze eating dots while avoiding ghosts. Grab power-up pellets to turn the tables and chase down ghosts in this iconic arcade experience. With its classic gameplay and timeless appeal, Pac-Man continues to entertain players of all ages.',
    features: [
      'Classic maze navigation',
      'Ghost AI with unique behaviors',
      'Power-up pellets for ghost chasing',
      'Progressive difficulty',
      'Iconic retro design',
      'High score tracking'
    ],
    howToPlay: [
      'Navigate Pac-Man through the maze',
      'Eat all dots to complete the level',
      'Avoid the four ghosts',
      'Eat power pellets to chase ghosts',
      'Eat fruit for bonus points'
    ],
    tips: [
      'Learn each ghost\'s behavior pattern',
      'Use power pellets strategically',
      'Plan escape routes before entering tight areas',
      'Clear dots near ghosts while powered up',
      'Learn the safe zones in the maze'
    ],
    benefits: [
      'Improves spatial navigation',
      'Enhances strategic planning',
      'Develops quick decision-making',
      'Provides classic arcade nostalgia'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'maze', 'ghosts', 'power-ups', 'classic'],
    relatedGames: ['snake-3d', 'dino-jump', 'tank-1990']
  },
  'colors-sort': {
    id: 'colors-sort',
    name: 'Colors Sort',
    emoji: '🎨',
    category: 'Puzzle',
    description: 'Sort colored liquids into matching tubes - challenging logic puzzle!',
    longDescription:
      "Colors Sort is a captivating logic puzzle game that challenges your problem-solving skills. Pour colored liquids between tubes to sort them by color, with each tube eventually containing only one color. The game starts simple but quickly becomes a brain-teasing challenge as more colors and tubes are introduced.",
    features: [
      'Satisfying liquid pouring mechanics',
      'Beautiful color gradients',
      'Undo moves when needed',
      'No time limits - think carefully',
      'Progressive difficulty curve',
      'Relaxing background experience'
    ],
    howToPlay: [
      'Tap a tube to pick up the top color',
      'Tap another tube to pour the color',
      'Only pour onto same color or empty tube',
      'Sort all colors into separate tubes',
      'Complete the level with all tubes sorted'
    ],
    tips: [
      'Plan several moves ahead',
      'Keep one tube empty for maneuvering',
      'Start by isolating one color completely',
      'Use the undo button to try different strategies',
      "Don't rush - take time to think"
    ],
    benefits: [
      'Enhances logical reasoning',
      'Improves problem-solving skills',
      'Develops planning abilities',
      'Provides relaxing brain training'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'logic', 'sorting', 'brain-teaser', 'strategy'],
    relatedGames: ['block-blast', 'candy-crush', 'pipe-connect']
  },
  'popit-fidget': {
    id: 'popit-fidget',
    name: 'Popit Fidget',
    emoji: '🫧',
    category: 'Arcade',
    description: 'Pop satisfying bubbles in this relaxing fidget toy simulation!',
    longDescription:
      "Popit Fidget brings the satisfying sensation of popping bubble wrap to your device. This relaxing game simulates the popular fidget toy, offering a stress-relieving experience with colorful bubble grids. Pop bubbles in various patterns and shapes while enjoying the soothing sounds and visual feedback.",
    features: [
      'Realistic bubble popping simulation',
      'Multiple colorful designs and shapes',
      'Satisfying sound effects and haptics',
      'Various game modes and challenges',
      'Stress-relief and relaxation focus',
      'No time pressure'
    ],
    howToPlay: [
      'Tap bubbles to pop them',
      'Complete patterns and challenges',
      'Pop all bubbles to flip the board',
      'Try different popping strategies',
      'Enjoy the satisfying sounds and visuals'
    ],
    tips: [
      'Take your time and enjoy the experience',
      'Try creating patterns while popping',
      'Use the game for stress relief breaks',
      'Experiment with different popping sequences',
      'Play with sound on for full sensory experience'
    ],
    benefits: [
      'Provides stress relief and relaxation',
      'Offers satisfying sensory feedback',
      'Perfect for short breaks',
      'Suitable for all ages'
    ],
    difficulty: 'Easy',
    ageRating: 'Everyone',
    tags: ['arcade', 'relaxing', 'fidget', 'stress-relief', 'casual'],
    relatedGames: ['balloon-blaster', 'whack-a-mole', 'bubble-shooter']
  },
  'balloon-blaster': {
    id: 'balloon-blaster',
    name: 'Balloon Blaster',
    emoji: '🎈',
    category: 'Arcade',
    description: 'Pop rising balloons before they escape - quick taps and swipes win!',
    longDescription:
      'Balloon Blaster is an exciting arcade game where colorful balloons continuously rise from the bottom of the screen. Your mission is to pop them before they escape off the top. The game features various balloon types, power-ups, and increasing difficulty as you progress.',
    features: [
      'Colorful balloon graphics',
      'Fast-paced popping action',
      'Various balloon types',
      'Combo system for high scores',
      'Progressive difficulty',
      'Satisfying pop effects'
    ],
    howToPlay: [
      'Tap balloons to pop them',
      'Swipe through multiple balloons for combos',
      "Don't let balloons escape off the top",
      'Pop special balloons for power-ups',
      'Achieve high scores with combos'
    ],
    tips: [
      'Use swipe gestures for multiple balloons',
      'Prioritize balloons near the top',
      'Look for special balloon patterns',
      'Build combos for bonus points',
      'Stay calm during intense moments'
    ],
    benefits: [
      'Improves reflexes and speed',
      'Enhances hand-eye coordination',
      'Provides exciting arcade action',
      'Develops quick decision-making'
    ],
    difficulty: 'Easy to Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'balloon', 'popping', 'casual', 'colorful'],
    relatedGames: ['whack-a-mole', 'fruit-ninja', 'popit-fidget']
  },
  'space-fighter': {
    id: 'space-fighter',
    name: 'Space Fighter',
    emoji: '🚀',
    category: 'Action',
    description: 'Pilot your spaceship through asteroid fields - endless space survival!',
    longDescription:
      'Space Fighter is a thrilling space game where you pilot a spacecraft through dangerous asteroid fields. Navigate through space, dodge obstacles, and collect power-ups to enhance your ship. The game features smooth controls, intense action, and beautiful space-themed graphics.',
    features: [
      'Intense space combat action',
      'Smooth spaceship controls',
      'Various enemy types',
      'Power-up system',
      'Beautiful space graphics',
      'Endless survival mode'
    ],
    howToPlay: [
      'Drag to move your spaceship',
      'Dodge asteroids and obstacles',
      'Collect power-ups for upgrades',
      'Survive as long as possible',
      'Beat your high score'
    ],
    tips: [
      'Keep moving to avoid obstacles',
      'Collect power-ups when safe',
      'Learn obstacle patterns',
      'Use the edges of the screen strategically',
      'Stay focused during intense sections'
    ],
    benefits: [
      'Improves reflexes and reaction time',
      'Enhances spatial awareness',
      'Provides thrilling gameplay',
      'Develops focus under pressure'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['action', 'space', 'shooter', 'arcade', 'survival'],
    relatedGames: ['car-racing', 'bike-racing', 'tank-1990']
  },
  'word-search': {
    id: 'word-search',
    name: 'Word Search',
    emoji: '🔤',
    category: 'Puzzle',
    description: 'Find hidden words in the letter grid by swiping to select them!',
    longDescription:
      'Word Search is a classic puzzle game where you find hidden words in a grid of letters. Swipe to select words hidden horizontally, vertically, or diagonally. Multiple word categories and timed challenges test your vocabulary and pattern recognition.',
    features: [
      'Classic word search gameplay',
      'Multiple word categories',
      'Swipe to select words',
      'Timed challenges',
      'Progressive difficulty',
      'Vocabulary building'
    ],
    howToPlay: [
      'Scan the letter grid for hidden words',
      'Swipe across letters to select a word',
      'Words can be horizontal, vertical, or diagonal',
      'Find all words to complete the puzzle',
      'Complete puzzles faster for better scores'
    ],
    tips: [
      'Scan for uncommon letter combinations',
      'Look for the first and last letters of words',
      'Check all eight directions',
      'Cross off found words to narrow your search',
      'Practice improves your scanning speed'
    ],
    benefits: [
      'Builds vocabulary',
      'Improves pattern recognition',
      'Enhances concentration',
      'Provides educational entertainment'
    ],
    difficulty: 'Easy to Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'words', 'swipe', 'vocabulary', 'timed'],
    relatedGames: ['number-search', 'sudoku', 'sliding-numbers']
  },
  'number-search': {
    id: 'number-search',
    name: 'Number Search',
    emoji: '🔢',
    category: 'Puzzle',
    description: 'Find hidden number sequences in the digit grid!',
    longDescription:
      'Number Search is a puzzle game where you find hidden number sequences in a grid of digits. Swipe to select number patterns hidden in the grid. Progressive grid sizes and number patterns challenge your observation skills.',
    features: [
      'Number-based search gameplay',
      'Multiple grid sizes',
      'Swipe to select sequences',
      'Progressive difficulty',
      'Pattern recognition challenges',
      'Clean interface'
    ],
    howToPlay: [
      'Scan the digit grid for hidden number sequences',
      'Swipe across digits to select a sequence',
      'Sequences can be in any direction',
      'Find all sequences to complete the puzzle',
      'Faster completion earns better scores'
    ],
    tips: [
      'Look for distinctive number patterns',
      'Scan systematically row by row',
      'Check diagonal directions too',
      'Mark found sequences mentally',
      'Practice improves observation speed'
    ],
    benefits: [
      'Enhances observation skills',
      'Improves number recognition',
      'Develops concentration',
      'Provides brain training'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'numbers', 'swipe', 'patterns', 'observation'],
    relatedGames: ['word-search', 'sudoku', 'sliding-numbers']
  },
  'tank-1990': {
    id: 'tank-1990',
    name: 'Tank 1990',
    emoji: '🪖',
    category: 'Arcade',
    description: 'Command your tank in classic battle warfare!',
    longDescription:
      'Tank 1990 is a classic battle game where you command a tank to destroy enemy tanks and defend your base. Navigate through destructible terrain with intelligent enemy AI patterns. This retro-style game offers exciting tank combat with strategic gameplay.',
    features: [
      'Classic tank battle gameplay',
      'Destructible terrain',
      'Intelligent enemy AI',
      'Base defense objective',
      'Multiple levels',
      'Retro-style graphics'
    ],
    howToPlay: [
      'Control your tank with directional controls',
      'Shoot to destroy enemy tanks',
      'Protect your base from enemy attacks',
      'Destroy all enemy tanks to complete levels',
      'Use terrain for cover and strategy'
    ],
    tips: [
      'Protect your base at all costs',
      'Use terrain as cover from enemy fire',
      'Prioritize enemies heading toward your base',
      'Learn enemy movement patterns',
      'Upgrade your tank when possible'
    ],
    benefits: [
      'Enhances strategic thinking',
      'Improves reaction time',
      'Develops tactical planning',
      'Provides classic retro gaming'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'battle', 'tanks', 'defense', 'retro'],
    relatedGames: ['space-fighter', 'pac-man', 'car-racing']
  },
  'nuts-and-bolts': {
    id: 'nuts-and-bolts',
    name: 'Nuts and Bolts',
    emoji: '🔩',
    category: 'Puzzle',
    description: 'Unscrew bolts and remove planks to solve physics puzzles!',
    longDescription:
      'Nuts and Bolts is a physics-based puzzle game where you unscrew bolts and remove planks to solve increasingly complex puzzles. Plan your moves carefully as each bolt removal affects the entire structure. The game challenges your logical thinking and understanding of physics.',
    features: [
      'Physics-based puzzle mechanics',
      'Bolt unscrewing gameplay',
      'Increasingly complex structures',
      'Realistic physics simulation',
      'Multiple levels',
      'Strategic planning required'
    ],
    howToPlay: [
      'Tap bolts to unscrew them',
      'Remove planks by unscrewing their bolts',
      'Plan the order of bolt removal carefully',
      'Use physics to your advantage',
      'Complete each level by clearing all pieces'
    ],
    tips: [
      'Study the structure before removing any bolts',
      'Remove bolts that support fewer pieces first',
      'Think about how gravity will affect remaining pieces',
      'Some puzzles require a specific order',
      'Be patient and plan ahead'
    ],
    benefits: [
      'Develops logical thinking',
      'Improves understanding of physics',
      'Enhances problem-solving skills',
      'Provides satisfying puzzle solving'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'physics', 'bolts', 'mechanics', 'logic'],
    relatedGames: ['pipe-connect', 'colors-sort', 'block-blast']
  },
  'ludo-king': {
    id: 'ludo-king',
    name: 'Ludo King',
    emoji: '🎲',
    category: 'Strategy',
    description: 'Roll the dice and race your tokens home in this classic board game!',
    longDescription:
      'Ludo King is the classic board game where you roll the dice and race your tokens home. Play against AI opponents with strategic token movement and blocking tactics. This timeless family game offers fun for all ages with its simple rules and deep strategy.',
    features: [
      'Classic Ludo board game',
      'AI opponents',
      'Dice rolling mechanics',
      'Strategic token movement',
      'Blocking and capturing tactics',
      'Clean board design'
    ],
    howToPlay: [
      'Roll the dice to move your tokens',
      'Move tokens out of base with a 6',
      'Navigate tokens around the board to home',
      'Land on opponent tokens to send them back',
      'Get all four tokens home to win'
    ],
    tips: [
      'Spread your tokens across the board',
      'Use blocking positions to slow opponents',
      'Prioritize getting tokens out of base',
      'Be strategic about which token to move',
      'Balance offense and defense'
    ],
    benefits: [
      'Develops strategic thinking',
      'Improves decision-making',
      'Provides classic board game fun',
      'Enhances probability understanding'
    ],
    difficulty: 'Easy to Medium',
    ageRating: 'Everyone',
    tags: ['strategy', 'board', 'dice', 'tokens', 'classic'],
    relatedGames: ['dots-and-boxes', 'tic-tac-toe', 'spider-solitaire']
  },
  'spider-solitaire': {
    id: 'spider-solitaire',
    name: 'Spider Solitaire',
    emoji: '🃏',
    category: 'Puzzle',
    description: 'Build card sequences from King to Ace - classic solitaire!',
    longDescription:
      'Spider Solitaire is a classic card game where you build sequences from King to Ace and clear the tableau. Multiple suit difficulties and undo support provide strategic depth. This timeless card game challenges your planning and organizational skills.',
    features: [
      'Classic Spider Solitaire gameplay',
      'Multiple difficulty levels',
      'Undo move support',
      'Card sequence building',
      'Clean card designs',
      'Score tracking'
    ],
    howToPlay: [
      'Build descending card sequences on the tableau',
      'Complete sequences from King to Ace to clear them',
      'Move cards between columns to reveal hidden cards',
      'Deal new cards when stuck',
      'Clear all cards to win'
    ],
    tips: [
      'Focus on uncovering hidden cards',
      'Build sequences of the same suit when possible',
      'Keep columns available for maneuvering',
      'Plan several moves ahead',
      'Use undo wisely for strategic play'
    ],
    benefits: [
      'Enhances strategic planning',
      'Improves organizational skills',
      'Develops patience',
      'Provides classic card game enjoyment'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'cards', 'solitaire', 'sequences', 'classic'],
    relatedGames: ['sudoku', 'mine-sweeper', 'ludo-king']
  },
  'maze-runner': {
    id: 'maze-runner',
    name: 'Maze Runner',
    emoji: '🧩',
    category: 'Puzzle',
    description: 'Navigate ball through procedural mazes - tilt and physics controls!',
    longDescription:
      'Maze Runner is a challenging puzzle game where you guide a ball through intricate mazes using tilt controls or touch gestures. The game features procedurally generated mazes, physics-based movement, and various obstacles to overcome.',
    features: [
      'Procedurally generated mazes',
      'Physics-based ball movement',
      'Tilt or touch controls',
      'Multiple difficulty levels',
      'Various maze sizes (8x8 to 12x12)',
      'Progress tracking'
    ],
    howToPlay: [
      'Tilt device or swipe to roll the ball',
      'Navigate through the maze',
      'Avoid obstacles and dead ends',
      'Reach the exit to complete the level',
      'Complete faster for better scores'
    ],
    tips: [
      "Take your time - speed isn't everything",
      'Learn to control ball momentum',
      'Study the maze layout before moving',
      'Use walls to slow down when needed',
      'Practice makes perfect with tilt controls'
    ],
    benefits: [
      'Improves spatial navigation',
      'Enhances problem-solving skills',
      'Develops motor control',
      'Provides satisfying puzzle completion'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'maze', 'physics', 'strategy', 'navigation'],
    relatedGames: ['pipe-connect', 'sliding-numbers', 'connect-em-all']
  },
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    emoji: '❌',
    category: 'Strategy',
    description: 'Play classic X and O against smart AI - strategic thinking!',
    longDescription:
      'Tic Tac Toe is the classic X and O game powered by a smart minimax AI algorithm. Quick casual matches challenge your strategic thinking in this timeless game. Simple to learn but strategic depth makes it endlessly replayable.',
    features: [
      'Classic X and O gameplay',
      'Smart AI powered by minimax algorithm',
      'Quick match format',
      'Clean and intuitive interface',
      'Win tracking',
      'Instant restart'
    ],
    howToPlay: [
      'Tap to place your X or O',
      'Get three in a row to win',
      'Block your opponent from completing a row',
      'Rows can be horizontal, vertical, or diagonal',
      'Think ahead to outmaneuver the AI'
    ],
    tips: [
      'Always take the center if available',
      'Take corners over edges',
      'Look for fork opportunities (two ways to win)',
      'Block opponent forks early',
      'The first player has an advantage - use it wisely'
    ],
    benefits: [
      'Develops strategic thinking',
      'Improves pattern recognition',
      'Enhances logical reasoning',
      'Provides quick mental exercise'
    ],
    difficulty: 'Easy',
    ageRating: 'Everyone',
    tags: ['strategy', 'AI', 'classic', 'quick', 'logic'],
    relatedGames: ['dots-and-boxes', 'ludo-king', 'sudoku']
  },
  'car-racing': {
    id: 'car-racing',
    name: 'Car Racing',
    emoji: '🏎️',
    category: 'Action',
    description: 'Dodge traffic and race through lanes - test your reflexes!',
    longDescription:
      'Car Racing is a high-speed racing game that puts you behind the wheel navigating through busy traffic. Dodge other vehicles, change lanes strategically, and push your speed to the limit while avoiding crashes.',
    features: [
      'Fast-paced racing action',
      'Lane-changing mechanics',
      'Increasing speed over time',
      'Distance-based scoring',
      'Near-miss bonuses',
      'Smooth controls'
    ],
    howToPlay: [
      'Tap left or right to change lanes',
      'Avoid crashing into other vehicles',
      'Drive as far as possible',
      'Near-misses earn bonus points',
      'Beat your high score'
    ],
    tips: [
      'Plan lane changes ahead of time',
      'Use near-misses for bonus points',
      "Don't stay in one lane too long",
      'Watch for traffic patterns',
      'Stay focused at high speeds'
    ],
    benefits: [
      'Improves reflexes and reaction time',
      'Enhances focus and concentration',
      'Provides thrilling gameplay',
      'Develops quick decision-making'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['racing', 'action', 'cars', 'traffic', 'endless'],
    relatedGames: ['bike-racing', 'space-fighter', 'dino-jump']
  },
  'bike-racing': {
    id: 'bike-racing',
    name: 'Bike Racing',
    emoji: '🏍️',
    category: 'Action',
    description: 'Race on bikes through traffic - faster and more challenging!',
    longDescription:
      'Bike Racing takes the racing experience to the next level with high-speed motorcycle action. Navigate through dense traffic on your bike, performing daring maneuvers and near-misses for bonus points. Faster and more challenging than car racing.',
    features: [
      'High-speed motorcycle racing',
      'Intense traffic navigation',
      'Tilt or touch controls',
      'Faster pace than car racing',
      'Near-miss bonuses',
      'Competitive scoring'
    ],
    howToPlay: [
      'Tilt device or tap to steer',
      'Weave through traffic carefully',
      'Perform near-misses for bonuses',
      'Drive as far as possible',
      'Beat your high score'
    ],
    tips: [
      'Master the controls before going fast',
      'Practice near-miss timing',
      'Stay between lanes when safe',
      'Anticipate traffic patterns',
      'Stay calm at high speeds'
    ],
    benefits: [
      'Improves reflexes dramatically',
      'Enhances focus under pressure',
      'Provides adrenaline-pumping gameplay',
      'Develops quick decision-making'
    ],
    difficulty: 'Hard',
    ageRating: 'Everyone',
    tags: ['racing', 'action', 'motorcycle', 'traffic', 'fast-paced'],
    relatedGames: ['car-racing', 'space-fighter', 'dino-jump']
  },
  'sliding-numbers': {
    id: 'sliding-numbers',
    name: 'Sliding Numbers',
    emoji: '🔢',
    category: 'Puzzle',
    description: 'Slide numbered tiles to solve puzzles - classic sliding puzzle!',
    longDescription:
      'Sliding Numbers is a classic puzzle game that challenges your logical thinking and spatial reasoning. Slide numbered tiles on a grid to arrange them in the correct order using the empty space strategically. Multiple grid sizes from 3x3 to 5x5 provide varying difficulty levels.',
    features: [
      'Classic sliding puzzle mechanics',
      'Multiple grid sizes (3x3 to 5x5)',
      'Move counter tracking',
      'Best time records',
      'Clean, minimalist design',
      'Undo move option'
    ],
    howToPlay: [
      'Tap tiles adjacent to empty space',
      'Slide tiles to rearrange numbers',
      'Arrange numbers in sequential order',
      'Complete puzzle with fewest moves',
      'Challenge yourself with larger grids'
    ],
    tips: [
      'Solve top row first, then work down',
      'Plan several moves ahead',
      'Use the empty space strategically',
      "Don't undo too much - learn from mistakes",
      'Start with smaller grids to learn patterns'
    ],
    benefits: [
      'Improves logical thinking',
      'Enhances spatial reasoning',
      'Develops problem-solving skills',
      'Provides classic puzzle challenge'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', 'sliding', 'numbers', 'logic', 'brain-teaser'],
    relatedGames: ['game-2048', 'sudoku', 'maze-runner']
  },
  'game-2048': {
    id: 'game-2048',
    name: '2048',
    emoji: '🎮',
    category: 'Puzzle',
    description: 'Merge matching tiles to reach 2048 and beyond - addictive puzzle!',
    longDescription:
      '2048 is the incredibly addictive puzzle game where you slide numbered tiles on a 4x4 grid, merging matching numbers to create higher values. The goal is to reach the 2048 tile, but you can continue beyond for even higher scores.',
    features: [
      'Addictive merging gameplay',
      'Clean, minimalist design',
      'Smooth tile animations',
      'Undo move option',
      'High score tracking',
      'Continue after 2048'
    ],
    howToPlay: [
      'Swipe in any direction to move tiles',
      'Matching numbers merge into one',
      'Each move adds a new tile (2 or 4)',
      'Reach 2048 to win',
      'Continue playing for higher scores'
    ],
    tips: [
      'Keep highest tile in a corner',
      'Build numbers in one direction',
      "Don't move highest tile unnecessarily",
      'Plan moves to avoid filling the board',
      'Focus on creating large merges'
    ],
    benefits: [
      'Enhances strategic thinking',
      'Improves mathematical intuition',
      'Develops planning skills',
      'Provides addictive brain training'
    ],
    difficulty: 'Medium to Hard',
    ageRating: 'Everyone',
    tags: ['puzzle', '2048', 'merging', 'strategy', 'addictive'],
    relatedGames: ['sliding-numbers', 'block-blast', 'fruit-merger']
  },
  'snake-3d': {
    id: 'snake-3d',
    name: 'Snake 3D',
    emoji: '🐍',
    category: 'Arcade',
    description: 'Eat eggs to grow longer and avoid walls - classic snake gameplay!',
    longDescription:
      "Snake 3D is a modern take on the classic snake game. Control a snake that grows longer each time it eats an egg. Navigate the playing field, collect eggs, and avoid crashing into walls or your own tail. Smooth controls and progressive difficulty make it easy to pick up but challenging to master.",
    features: [
      'Classic snake gameplay',
      'Smooth, responsive controls',
      'Progressive difficulty',
      'Score tracking',
      'Clean graphics',
      'Instant restart'
    ],
    howToPlay: [
      'Swipe to change snake direction',
      'Eat eggs to grow longer',
      'Avoid walls and your own tail',
      'Survive as long as possible',
      'Beat your high score'
    ],
    tips: [
      'Plan your path ahead of time',
      'Use the center of the screen',
      "Don't trap yourself in corners",
      'Maintain steady movements',
      'Practice makes perfect'
    ],
    benefits: [
      'Improves spatial planning',
      'Enhances reaction time',
      'Develops forward thinking',
      'Provides classic arcade fun'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'snake', 'classic', 'retro', 'endless'],
    relatedGames: ['pac-man', 'dino-jump', 'flappy-bird']
  },
  'perfect-circle': {
    id: 'perfect-circle',
    name: 'Perfect Circle',
    emoji: '⭕',
    category: 'Action',
    description: 'Draw the most perfect circle you can - test your precision!',
    longDescription:
      "Perfect Circle is a unique skill-based game that challenges you to draw the most perfect circle possible. Trace a circle and receive a score based on how close you came to perfection. The game tests your hand-eye coordination, steady hand control, and precision.",
    features: [
      'Precision drawing challenge',
      'Accuracy scoring system',
      'Practice mode available',
      'Minimalist design',
      'Instant feedback',
      'Share your best scores'
    ],
    howToPlay: [
      'Press and hold to start drawing',
      'Draw a circle in one motion',
      'Release when you complete the circle',
      'Receive accuracy score',
      'Try to achieve 100% perfection'
    ],
    tips: [
      'Draw at a steady, consistent speed',
      'Use your whole arm, not just wrist',
      'Practice with different sizes',
      'Stay relaxed - tension affects accuracy',
      'Find your optimal drawing speed'
    ],
    benefits: [
      'Develops fine motor control',
      'Enhances hand-eye coordination',
      'Provides unique challenge',
      'Improves precision and patience'
    ],
    difficulty: 'Hard',
    ageRating: 'Everyone',
    tags: ['action', 'skill', 'precision', 'drawing', 'challenge'],
    relatedGames: ['knife-hit', 'stack-tower', 'color-switch']
  },
  sudoku: {
    id: 'sudoku',
    name: 'Sudoku',
    emoji: '🔟',
    category: 'Puzzle',
    description: 'Fill the 9x9 grid with numbers 1-9 with no repeats!',
    longDescription:
      "Sudoku is the world's most popular number puzzle game. Fill every row, column, and 3x3 box with numbers 1-9 without repeating any digit. Starting with a partially filled grid, use logic and deduction to complete the puzzle. Multiple difficulty levels provide endless brain-training entertainment.",
    features: [
      'Classic 9x9 Sudoku grid',
      'Multiple difficulty levels',
      'Error highlighting',
      'Clean and intuitive controls',
      'Offline play support',
      'Unlimited puzzles'
    ],
    howToPlay: [
      'Fill empty cells with numbers 1-9',
      'Each row must contain numbers 1-9 without repeats',
      'Each column must contain numbers 1-9 without repeats',
      'Each 3x3 box must contain numbers 1-9 without repeats',
      'Use logic and deduction - no guessing needed'
    ],
    tips: [
      'Start with rows, columns, or boxes that have the most filled cells',
      'Look for naked singles - cells where only one number fits',
      'Scan rows and columns for hidden singles',
      'Practice daily to improve your solving speed',
      "Don't guess - every Sudoku has a unique logical solution"
    ],
    benefits: [
      'Improves logical reasoning and deduction',
      'Enhances concentration and focus',
      'Boosts memory and pattern recognition',
      'Provides excellent daily brain training'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'numbers', 'logic', 'brain-teaser', 'classic'],
    relatedGames: ['mine-sweeper', 'sliding-numbers', 'word-search']
  },
  'block-breaker': {
    id: 'block-breaker',
    name: 'Block Breaker',
    emoji: '🧱',
    category: 'Arcade',
    description: 'Break bricks with a bouncing ball and paddle - arcade action!',
    longDescription:
      'Block Breaker is a classic arcade game where you control a paddle to bounce a ball and break all the bricks on screen. With power-ups, multi-ball mechanics, and progressively challenging levels, this timeless game tests your reflexes and precision.',
    features: [
      'Classic brick-breaking gameplay',
      'Smooth ball physics and paddle controls',
      'Power-ups including multi-ball',
      'Colorful brick formations',
      'Progressive difficulty',
      'Satisfying brick destruction effects'
    ],
    howToPlay: [
      'Move the paddle left and right to bounce the ball',
      'Break all bricks on screen to complete each level',
      'Catch power-ups that fall from broken bricks',
      "Don't let the ball fall below the paddle",
      'Aim for strategic angles to reach difficult bricks'
    ],
    tips: [
      'Keep the ball in play by staying centered under it',
      'Aim for corners to get the ball behind brick rows',
      'Collect power-ups quickly before they fall off screen',
      'Multi-ball power-ups are the most valuable',
      'Be patient with the last few bricks'
    ],
    benefits: [
      'Improves hand-eye coordination',
      'Enhances reflexes and reaction time',
      'Provides satisfying arcade fun',
      'Boosts spatial awareness'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'classic', 'brick-breaker', 'action', 'reflexes'],
    relatedGames: ['pac-man', 'flappy-bird', 'stack-tower']
  },
  'knife-hit': {
    id: 'knife-hit',
    name: 'Knife Hit',
    emoji: '🔪',
    category: 'Action',
    description: "Throw knives at the spinning log - don't hit another knife!",
    longDescription:
      'Knife Hit is a thrilling action game where you throw knives at a spinning wooden log. Time your throws carefully to avoid hitting knives already stuck in the log. Hit the apple targets for bonus points! With each level, the log spins faster and the challenge intensifies.',
    features: [
      'One-tap knife throwing',
      'Spinning log with dynamic patterns',
      'Apple targets for bonus points',
      'Progressive difficulty',
      'Satisfying knife-sticking mechanics',
      'Clean visual design'
    ],
    howToPlay: [
      'Tap the screen to throw a knife at the spinning log',
      "Don't hit knives already stuck in the log",
      'Hit apple targets for bonus points',
      'Use all your knives to complete each level',
      'Time your throws between gaps in existing knives'
    ],
    tips: [
      'Watch the rotation pattern before throwing',
      'Time your throws for the widest gaps',
      'Be patient - rushing leads to collisions',
      'Apple bonuses are worth the extra risk',
      'Focus on rhythm rather than aiming'
    ],
    benefits: [
      'Improves timing and precision',
      'Enhances patience and focus',
      'Develops rhythm and pattern recognition',
      'Provides exciting and addictive gameplay'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['action', 'timing', 'precision', 'addictive', 'casual'],
    relatedGames: ['fruit-ninja', 'perfect-circle', 'color-switch']
  },
  'color-switch': {
    id: 'color-switch',
    name: 'Color Switch',
    emoji: '🌈',
    category: 'Arcade',
    description: 'Jump through matching color obstacles - time your taps to survive!',
    longDescription:
      "Color Switch is a fast-paced arcade game where you control a colored ball that must pass through obstacles matching its color. Tap to jump and time your moves perfectly to pass through the correct color segments of rotating obstacles.",
    features: [
      'One-tap jump mechanics with color matching',
      'Rotating color obstacles',
      'Color-switching stars',
      'Progressive difficulty',
      'Vibrant colors and smooth animations',
      'Endless gameplay'
    ],
    howToPlay: [
      'Tap to make the ball jump upward',
      "Pass through obstacles that match your ball's color",
      "Collect stars to change your ball's color",
      'Avoid touching obstacle segments of different colors',
      'Score points for each obstacle cleared'
    ],
    tips: [
      'Focus on the color segments, not the whole obstacle',
      'Wait for the right moment - patience is key',
      'Anticipate color changes from stars',
      'Develop a rhythm for rotating obstacles',
      'Stay calm under pressure for better timing'
    ],
    benefits: [
      'Improves color recognition and awareness',
      'Enhances reflexes and reaction time',
      'Develops patience and timing',
      'Provides challenging arcade gameplay'
    ],
    difficulty: 'Hard',
    ageRating: 'Everyone',
    tags: ['arcade', 'color', 'timing', 'reflexes', 'addictive'],
    relatedGames: ['flappy-bird', 'stack-tower', 'perfect-circle']
  },
  'stack-tower': {
    id: 'stack-tower',
    name: 'Stack Tower',
    emoji: '🏗️',
    category: 'Arcade',
    description: 'Stack sliding blocks perfectly to build the tallest tower!',
    longDescription:
      "Stack Tower is an addictive arcade game where you stack sliding blocks on top of each other to build the tallest tower possible. Tap at the right moment to place each block - if you're off, the overhanging part gets cut off, making the next block smaller.",
    features: [
      'One-tap stacking with precision timing',
      'Sliding blocks that require alignment',
      'Perfect placement bonuses',
      'Progressive difficulty',
      'Satisfying visual feedback',
      'Clean, modern design'
    ],
    howToPlay: [
      'Tap to place the sliding block on the stack',
      'Align the block as precisely as possible',
      'Overhanging portions get cut off',
      'Perfect placements maintain block size',
      'Game ends when the block becomes too small'
    ],
    tips: [
      'Focus on the edges of the blocks for alignment',
      'Tap slightly early rather than late',
      'Perfect placements keep your tower wide',
      'Stay calm as the tower gets taller',
      'Develop a consistent rhythm'
    ],
    benefits: [
      'Improves timing and precision',
      'Enhances focus and concentration',
      'Provides satisfying gameplay',
      'Develops hand-eye coordination'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['arcade', 'stacking', 'timing', 'precision', 'addictive'],
    relatedGames: ['color-switch', 'flappy-bird', 'block-breaker']
  },
  'mine-sweeper': {
    id: 'mine-sweeper',
    name: 'Mine Sweeper',
    emoji: '💣',
    category: 'Puzzle',
    description: 'Reveal safe cells without hitting mines - classic logic game!',
    longDescription:
      'Mine Sweeper is the iconic logic puzzle game where you must uncover all safe cells on a grid without triggering any hidden mines. Use numbered clues that indicate how many mines surround each cell to deduce safe cells and flag dangerous ones.',
    features: [
      'Classic Minesweeper gameplay',
      'Tap to reveal, long-press to flag',
      'Numbered clues for deduction',
      'Multiple difficulty levels',
      'Clean, modern interface',
      'First-click safety'
    ],
    howToPlay: [
      'Tap a cell to reveal it',
      'Numbers show how many mines surround that cell',
      'Long-press to flag a cell you think contains a mine',
      'Use logic to deduce which cells are safe',
      'Reveal all non-mine cells to win'
    ],
    tips: [
      'Start by revealing cells near the edges or corners',
      'Use flags to mark confirmed mine locations',
      'Count carefully - the numbers never lie',
      'Look for patterns with 1s along edges',
      'If stuck, look for cells that must be safe by elimination'
    ],
    benefits: [
      'Enhances logical reasoning and deduction',
      'Improves pattern recognition',
      'Develops critical thinking skills',
      'Provides satisfying puzzle-solving moments'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'logic', 'classic', 'brain-teaser', 'strategy'],
    relatedGames: ['sudoku', 'spider-solitaire', 'dots-and-boxes']
  },
  'pipe-connect': {
    id: 'pipe-connect',
    name: 'Pipe Connect',
    emoji: '🔧',
    category: 'Puzzle',
    description: 'Rotate pipes to connect water flow from source to sink!',
    longDescription:
      'Pipe Connect is a satisfying puzzle game where you rotate pipe segments on a grid to create a continuous path from the water source to the sink. Each pipe piece can be rotated by tapping, and you must connect them all before time runs out.',
    features: [
      'Tap-to-rotate pipe puzzle mechanics',
      'Connect water flow from source to sink',
      'Progressively challenging grid layouts',
      'Multiple pipe types',
      'Timed gameplay',
      'Satisfying water flow animation'
    ],
    howToPlay: [
      'Tap a pipe segment to rotate it 90 degrees',
      'Connect all pipes from the source to the sink',
      'Create a continuous path without leaks',
      'Complete the connection before time runs out',
      'Plan your rotations for efficiency'
    ],
    tips: [
      'Start from the source and work toward the sink',
      'Look for pipes that can only connect one way',
      'Edge and corner pipes have limited options - solve those first',
      'Plan your path before rotating randomly',
      'T-junction pipes connect three directions - use them wisely'
    ],
    benefits: [
      'Enhances spatial reasoning',
      'Improves problem-solving skills',
      'Develops planning and strategic thinking',
      'Provides satisfying puzzle completion'
    ],
    difficulty: 'Medium',
    ageRating: 'Everyone',
    tags: ['puzzle', 'logic', 'pipe', 'spatial', 'brain-teaser'],
    relatedGames: ['maze-runner', 'colors-sort', 'nuts-and-bolts']
  }
};

export const GAMES_LIST = Object.values(gamesData);
