import { GAME_IDS, type GameCategory } from './UtilsService';

export interface GameMetadata {
  id: GAME_IDS;
  title: string;
  description: string;
  instructions: string[];
  categories: GameCategory[];
  /** Catalog badge only; this does not restrict gameplay. */
  isPremium?: boolean;
}

export const GAMES_METADATA: Record<GAME_IDS, GameMetadata> = {
  [GAME_IDS.BLOCK_BLAST]: {
    id: GAME_IDS.BLOCK_BLAST,
    title: 'Block Blast',
    description: 'Place blocks on the grid to clear full lines - strategic puzzle challenge!',
    instructions: [
      'Drag and drop block shapes onto the grid.',
      'Fill a complete row or column to clear it.',
      'Plan ahead to avoid running out of space.',
      'Score increases with each line cleared.',
      'Game ends when no blocks can be placed.'
    ],
    categories: ['block', 'puzzle']
  },
  [GAME_IDS.CONNECT_EM_ALL]: {
    id: GAME_IDS.CONNECT_EM_ALL,
    title: 'Connect Em All',
    description: 'Connect matching colored dots on the board to clear them and score points!',
    instructions: [
      'Tap a colored dot and drag to a matching one.',
      'Paths cannot cross other connections.',
      'Fill the entire board to complete the level.',
      'Use fewer moves for a higher score.',
      'Undo moves by tapping the last connected dot.'
    ],
    categories: ['block', 'puzzle']
  },
  [GAME_IDS.TILE_HOME]: {
    id: GAME_IDS.TILE_HOME,
    title: 'Tile Home',
    description: 'Match 3 tiles of the same type to clear them - classic mahjong puzzle fun!',
    instructions: [
      'Tap tiles to add them to the holding bar.',
      'Match 3 identical tiles to clear them.',
      'The bar holds up to 7 tiles at a time.',
      'Plan your picks to avoid filling the bar.',
      'Game ends if the bar is full with no matches.'
    ],
    categories: ['block', 'casual']
  },
  [GAME_IDS.ARROWS]: {
    id: GAME_IDS.ARROWS,
    title: 'Arrows',
    description: 'Tap arrows to fly them off the board - clear them all before time runs out!',
    instructions: [
      'Tap an arrow to send it flying in its direction.',
      'An arrow can only leave if its path to the edge is clear.',
      'Blocked arrows shake — clear the ones in front first.',
      'Removing arrows opens new paths, so you can never get stuck.',
      'Clear every arrow before the timer ends to win.'
    ],
    categories: ['puzzle']
  },
  [GAME_IDS.CANDY_CRUSH]: {
    id: GAME_IDS.CANDY_CRUSH,
    title: 'Candy Crush',
    description: 'Match colorful candies in rows to score points - sweet puzzle fun!',
    instructions: [
      'Swap adjacent candies to match 3 or more.',
      'Matched candies are cleared and new ones fall.',
      'Match 4 or 5 for special candy power-ups.',
      'Clear the required targets to pass each level.',
      'Plan moves ahead for bigger combos.'
    ],
    categories: ['block', 'casual']
  },
  [GAME_IDS.PENGUIN_RUN]: {
    id: GAME_IDS.PENGUIN_RUN,
    isPremium: true,
    title: 'Penguin Run',
    description: 'A 3D temple runner - dash a penguin down an ancient jungle causeway to the finish line!',
    instructions: [
      'Every run is a fresh 1000 m track - reach the finish line to win and dance!',
      'Swipe left or right to switch lanes and grab coins for points.',
      'Swipe up to jump over broken gaps in the track.',
      'Swipe down to slide under spiked gateways.',
      'You have 3 lives - each slip costs one, and it gets faster the further you go!'
    ],
    categories: ['action', 'arcade']
  },
  [GAME_IDS.TREASURE_HUNT]: {
    id: GAME_IDS.TREASURE_HUNT,
    isPremium: true,
    title: 'Treasure Hunt',
    description: 'Explore a fresh 3D wilderness, discover diamonds and battle rogue robots.',
    instructions: [
      'Press Start Game to begin a new expedition through randomly generated grasslands.',
      'Swipe and hold to walk, drag farther to run, and release to stop.',
      'Tap to punch nearby robots; another finger can punch while you keep moving.',
      'Collect 24 diamonds and defeat 8 robots to complete the expedition.',
      'Use bridges to cross rivers and explore cave passages. Hills, water, rocks and tree trunks are solid.'
    ],
    categories: ['action', 'arcade']
  },
  [GAME_IDS.CAR_RACING]: {
    id: GAME_IDS.CAR_RACING,
    isPremium: true,
    title: 'Car Racing',
    description: 'Dodge oncoming traffic and race through busy lanes - test your reflexes!',
    instructions: [
      'Swipe left or right to steer across the road.',
      'Pass cars to score 500 points each.',
      'Rear-ending a car costs a life; side swipes only slow you down.',
      'Speed builds up the longer you drive.',
      'Reach the finish line at 2000 meters with lives left to win.'
    ],
    categories: ['racing']
  },
  [GAME_IDS.BIKE_RACING]: {
    id: GAME_IDS.BIKE_RACING,
    isPremium: true,
    title: 'Bike Racing',
    description: 'Race on bikes through heavy traffic - faster speeds and bigger challenges!',
    instructions: [
      'Swipe left or right to steer and lean through traffic.',
      'Pass bikes to score 500 points each.',
      'Running into a bike costs a life.',
      'Speed builds up the longer you ride.',
      'Reach the finish line at 2000 meters with lives left to win.'
    ],
    categories: ['racing']
  },
  [GAME_IDS.PLAY_WITH_TUA]: {
    id: GAME_IDS.PLAY_WITH_TUA,
    title: 'Play With Tua',
    description: 'Play with Tua, your playful companion. Dance, wave, laugh and discover every move!',
    instructions: [
      'Press Start Game or tap Tua to begin.',
      'Tap the scene to cycle through 10 actions, or choose one from the action strip.',
      'Drag across the scene to turn Tua and see every side.',
      'Each action repeats until you choose another. Stop Game resets your session.'
    ],
    categories: ['casual', 'arcade']
  },
  [GAME_IDS.BUBBLE_SHOOTER]: {
    id: GAME_IDS.BUBBLE_SHOOTER,
    title: 'Bubble Shooter',
    description: 'Aim and shoot bubbles to match 3 or more of the same color and clear them!',
    instructions: [
      'Aim and tap to shoot a bubble upward.',
      'Match 3 or more same-colored bubbles to pop them.',
      'Bubbles without support fall and give bonus points.',
      'Use wall bounces for tricky angles.',
      'Game ends if bubbles reach the bottom line.'
    ],
    categories: ['puzzle', 'arcade']
  },
  [GAME_IDS.BLOCK_BREAKER]: {
    id: GAME_IDS.BLOCK_BREAKER,
    title: 'Block Breaker',
    description: 'Break all the bricks with a bouncing ball and paddle - arcade action fun!',
    instructions: [
      'Drag the paddle left and right to bounce the ball.',
      'Hit all bricks on screen to clear the level.',
      'Some bricks need multiple hits to break.',
      "Don't let the ball fall below the paddle.",
      'Collect power-ups for extra abilities.'
    ],
    categories: ['block', 'arcade']
  },
  [GAME_IDS.FRUIT_NINJA]: {
    id: GAME_IDS.FRUIT_NINJA,
    title: 'Fruit Ninja',
    description: 'Slice all flying fruits with finger swipes and combos - avoid the bombs!',
    instructions: [
      'Swipe across fruits to slice them.',
      'Slice multiple fruits in one swipe for combos.',
      'Avoid slicing bombs or you lose a life.',
      "Don't let fruits fall without slicing them.",
      'Score as many points as you can before lives run out.'
    ],
    categories: ['action']
  },
  [GAME_IDS.BALLOON_BLASTER]: {
    id: GAME_IDS.BALLOON_BLASTER,
    title: 'Balloon Blaster',
    description: 'Pop colorful balloons as fast as you can before time runs out!',
    instructions: [
      'Tap balloons to pop them and earn points.',
      'Pop same-colored balloons in a row for combos.',
      'Avoid letting balloons fly off the screen.',
      'Special balloons give bonus points or extra time.',
      'Score as high as you can before time expires.'
    ],
    categories: ['action']
  },
  [GAME_IDS.FLAPPY_BIRD]: {
    id: GAME_IDS.FLAPPY_BIRD,
    title: 'Flappy Bird',
    description: 'Tap to flap and navigate through pipes - classic arcade challenge!',
    instructions: [
      'Tap the screen to flap and gain height.',
      'Navigate through gaps between pipes.',
      'Each pipe passed scores one point.',
      "Don't hit the pipes or the ground.",
      'Try to beat your high score each attempt.'
    ],
    categories: ['arcade']
  },
  [GAME_IDS.DINO_JUMP]: {
    id: GAME_IDS.DINO_JUMP,
    title: 'Dino Jump',
    description: 'Jump over obstacles and collect stars for extra lives - endless runner fun!',
    instructions: [
      'Tap to jump over incoming obstacles.',
      'Collect stars for bonus points and extra lives.',
      'Speed increases as you progress further.',
      'Time your jumps carefully for tall obstacles.',
      'Survive as long as possible for a high score.'
    ],
    categories: ['arcade', 'action']
  },
  [GAME_IDS.SNAKES_AND_LADDERS]: {
    id: GAME_IDS.SNAKES_AND_LADDERS,
    title: 'Snakes and Ladders',
    description: 'Classic board game - roll the dice, climb ladders, and avoid snakes to reach 100!',
    instructions: [
      'Roll the dice by tapping it on your turn.',
      'Climb ladders to jump ahead on the board.',
      'Watch out for snakes that slide you back down!',
      'Roll a 6 to get an extra turn.',
      'First player to reach cell 100 wins the game.'
    ],
    categories: ['strategy']
  },
  [GAME_IDS.LUDO_KING]: {
    id: GAME_IDS.LUDO_KING,
    title: 'Ludo King',
    description: 'Classic board game for all ages - roll dice and race your tokens back home!',
    instructions: [
      'Roll the dice by tapping it.',
      'Move your tokens based on the dice value.',
      'Roll a 6 to bring a new token into play.',
      "Land on an opponent's token to send it back.",
      'Get all 4 tokens home to win the game.'
    ],
    categories: ['strategy']
  },
  [GAME_IDS.DOTS_AND_BOXES]: {
    id: GAME_IDS.DOTS_AND_BOXES,
    title: 'Dots and Boxes',
    description: 'Connect the dots to complete boxes and outscore the AI - strategy game!',
    instructions: [
      'Tap between two dots to draw a line.',
      'Complete the fourth side of a box to claim it.',
      'Claimed boxes earn you a point and an extra turn.',
      'Try to force the opponent into giving you boxes.',
      'Player with the most boxes at the end wins.'
    ],
    categories: ['brain', 'strategy']
  },
  [GAME_IDS.WHACK_A_MOLE]: {
    id: GAME_IDS.WHACK_A_MOLE,
    title: 'Whack A Mole',
    description: 'Whack cute cats popping from holes - test your lightning reflexes!',
    instructions: [
      'Tap on moles as they pop up from holes.',
      'Each hit earns you points.',
      'Moles appear faster as you progress.',
      'Missing too many moles costs you lives.',
      'Score as high as you can before time runs out.'
    ],
    categories: ['action']
  },
  [GAME_IDS.PAC_MAN]: {
    id: GAME_IDS.PAC_MAN,
    title: 'Pac-Man',
    description: 'Classic arcade action - eat all dots, avoid ghosts, and clear the maze!',
    instructions: [
      'Swipe to move Pac-Man through the maze.',
      'Eat all dots on the board to clear the level.',
      'Avoid ghosts or you lose a life.',
      'Eat power pellets to turn ghosts vulnerable.',
      'Eat vulnerable ghosts for bonus points.'
    ],
    categories: ['arcade']
  },
  [GAME_IDS.SPACE_FIGHTER]: {
    id: GAME_IDS.SPACE_FIGHTER,
    title: 'Space Fighter',
    description: 'Pilot your spaceship through asteroid fields - endless space survival!',
    instructions: [
      'Drag your ship to dodge incoming asteroids.',
      'Shoot enemies by tapping the screen.',
      'Collect power-ups for shields and weapons.',
      'Survive as long as possible for a high score.',
      'Avoid collisions with asteroids and enemies.'
    ],
    categories: ['action']
  },
  [GAME_IDS.COLORS_SORT]: {
    id: GAME_IDS.COLORS_SORT,
    title: 'Colors Sort',
    description: 'Sort colored liquids into matching tubes - challenging logic puzzle!',
    instructions: [
      'Tap a tube to pick up the top color layer.',
      'Tap another tube to pour it in.',
      'You can only pour onto the same color or an empty tube.',
      'Sort all colors so each tube has one color.',
      'Use empty tubes strategically to rearrange.'
    ],
    categories: ['puzzle']
  },
  [GAME_IDS.POPIT_FIDGET]: {
    id: GAME_IDS.POPIT_FIDGET,
    title: 'Popit Fidget',
    description: 'Pop satisfying bubbles in this relaxing fidget toy simulation game!',
    instructions: [
      'Tap bubbles to pop them one by one.',
      'Pop all bubbles to complete a board.',
      'Enjoy the satisfying pop sounds and haptics.',
      'Try different patterns and shapes.',
      'A relaxing game with no time pressure.'
    ],
    categories: ['casual']
  },
  [GAME_IDS.WORD_SEARCH]: {
    id: GAME_IDS.WORD_SEARCH,
    title: 'Word Search',
    description: 'Find all hidden words in the letter grid - swipe to select and score!',
    instructions: [
      'Find words from the list hidden in the grid.',
      'Swipe across letters to select a word.',
      'Words can be horizontal, vertical, or diagonal.',
      'Found words are highlighted and crossed off.',
      'Find all words to complete the puzzle.'
    ],
    categories: ['education']
  },
  [GAME_IDS.NUMBER_SEARCH]: {
    id: GAME_IDS.NUMBER_SEARCH,
    title: 'Number Search',
    description: 'Find all hidden numbers in the digit grid - swipe to select and score!',
    instructions: [
      'Find number sequences hidden in the grid.',
      'Swipe across digits to select a number.',
      'Numbers can be in any direction.',
      'Found numbers are highlighted and crossed off.',
      'Find all numbers to complete the puzzle.'
    ],
    categories: ['education']
  },
  [GAME_IDS.TANK_1990]: {
    id: GAME_IDS.TANK_1990,
    title: 'Tank 1990',
    description: 'Classic tank battle game - destroy enemy tanks and defend your base to win!',
    instructions: [
      'Use the joystick to move your tank.',
      'Tap the fire button to shoot.',
      'Destroy all enemy tanks to clear the level.',
      'Protect your base from enemy fire.',
      'Collect power-ups for stronger weapons.'
    ],
    categories: ['action']
  },
  [GAME_IDS.NUTS_AND_BOLTS]: {
    id: GAME_IDS.NUTS_AND_BOLTS,
    title: 'Nuts and Bolts',
    description: 'Unscrew bolts and remove wooden planks to solve tricky mechanical puzzles!',
    instructions: [
      'Tap a bolt to unscrew it from a plank.',
      'Tap an empty hole to screw the bolt in.',
      'Remove all planks by unscrewing their bolts.',
      'Plan the order of moves carefully.',
      'Some bolts are blocked by other planks.'
    ],
    categories: ['puzzle']
  },
  [GAME_IDS.STACK_TOWER]: {
    id: GAME_IDS.STACK_TOWER,
    title: 'Stack Tower',
    description: 'Stack sliding blocks perfectly to build the tallest tower you can reach!',
    instructions: [
      'Tap to drop the sliding block onto the tower.',
      'Align it as perfectly as possible.',
      'Keep at least 40% of each block supported.',
      'Less support makes the block fall and ends the game.',
      'Build as tall as you can for a high score.'
    ],
    categories: ['arcade']
  },
  [GAME_IDS.PIPE_CONNECT]: {
    id: GAME_IDS.PIPE_CONNECT,
    title: 'Pipe Connect',
    description: 'Rotate pipes to connect the water flow from source to sink in time!',
    instructions: [
      'Tap a pipe piece to rotate it.',
      'Connect all pipes from the source to the sink.',
      'Water flows once the path is complete.',
      'Complete the puzzle before time runs out.',
      'All pipe pieces must be part of the path.'
    ],
    categories: ['puzzle']
  },
  [GAME_IDS.MINE_SWEEPER]: {
    id: GAME_IDS.MINE_SWEEPER,
    title: 'Mine Sweeper',
    description: 'Reveal all safe cells on the grid without hitting a hidden mine below!',
    instructions: [
      "Tap a cell to reveal what's underneath.",
      'Numbers show how many mines are adjacent.',
      'Long press a cell to flag it as a mine.',
      'Reveal all non-mine cells to win.',
      'Hitting a mine ends the game immediately.'
    ],
    categories: ['brain']
  },
  [GAME_IDS.KNIFE_HIT]: {
    id: GAME_IDS.KNIFE_HIT,
    title: 'Knife Hit',
    description: "Throw knives at the spinning log — don't hit another knife or apple!",
    instructions: [
      'Tap to throw a knife at the spinning log.',
      "Don't hit another knife already on the log.",
      'Hit apples for bonus points.',
      'Timing is key as the log spins.',
      'Throw all knives to clear the level.'
    ],
    categories: ['action']
  },
  [GAME_IDS.COLOR_SWITCH]: {
    id: GAME_IDS.COLOR_SWITCH,
    title: 'Color Switch',
    description: 'Jump through matching color obstacles — time your taps to survive!',
    instructions: [
      'Tap to make the ball jump upward.',
      "Pass through obstacles matching your ball's color.",
      'Your color changes when you hit a color switcher.',
      'Hitting the wrong color ends the game.',
      'Score points for each obstacle cleared.'
    ],
    categories: ['arcade']
  },
  [GAME_IDS.SPIDER_SOLITAIRE]: {
    id: GAME_IDS.SPIDER_SOLITAIRE,
    title: 'Spider Solitaire',
    description: 'Classic Spider Solitaire - build card sequences and clear the full tableau!',
    instructions: [
      'Arrange cards in descending order on columns.',
      'A complete sequence from King to Ace is removed.',
      'Tap the deck to deal new cards to all columns.',
      'Only ordered sequences can be moved together.',
      'Clear all cards from the tableau to win.'
    ],
    categories: ['brain']
  },
  [GAME_IDS.MAZE_RUNNER]: {
    id: GAME_IDS.MAZE_RUNNER,
    title: 'Maze Runner',
    description: 'Navigate ball through procedural mazes - tilt and physics controls!',
    instructions: [
      'Tilt your device to roll the ball through the maze.',
      'Navigate from the start to the exit point.',
      'Avoid dead ends and backtrack when needed.',
      'Complete the maze as quickly as possible.',
      'Each maze is randomly generated for variety.'
    ],
    categories: ['puzzle']
  },
  [GAME_IDS.TIC_TAC_TOE]: {
    id: GAME_IDS.TIC_TAC_TOE,
    title: 'Tic Tac Toe',
    description: 'Classic X and O strategy game - play against a smart AI and try to win!',
    instructions: [
      'Tap an empty cell to place your mark (X or O).',
      'Get 3 in a row horizontally, vertically, or diagonally.',
      'Block your opponent from completing their row.',
      'The AI adapts to your strategy.',
      'The game is a draw if the board fills with no winner.'
    ],
    categories: ['brain']
  },
  [GAME_IDS.SLIDING_NUMBERS]: {
    id: GAME_IDS.SLIDING_NUMBERS,
    title: 'Sliding Numbers',
    description: 'Slide numbered tiles into the right order - classic sliding puzzle game!',
    instructions: [
      'Tap a tile adjacent to the empty space to slide it.',
      'Arrange all numbers in ascending order.',
      'Start from top-left and work row by row.',
      'Use fewer moves for a better score.',
      'The puzzle is solved when all tiles are in order.'
    ],
    categories: ['puzzle']
  },
  [GAME_IDS.GAME_2048]: {
    id: GAME_IDS.GAME_2048,
    title: '2048',
    description: 'Merge matching number tiles to reach 2048 and beyond - addictive puzzle!',
    instructions: [
      'Swipe to move all tiles in one direction.',
      'Matching numbers merge into their sum.',
      'Plan moves to avoid filling the board.',
      'Reach the 2048 tile to win.',
      'Game ends when no moves are possible.'
    ],
    categories: ['puzzle']
  },
  [GAME_IDS.SUDOKU]: {
    id: GAME_IDS.SUDOKU,
    title: 'Sudoku',
    description: 'Fill the 9x9 grid with numbers 1-9 with no repeats in rows or columns!',
    instructions: [
      'Tap a cell and select a number to fill it.',
      'Each row must contain numbers 1-9 without repeats.',
      'Each column must also have no repeated numbers.',
      'Each 3x3 box must have unique numbers 1-9.',
      'Use logic to eliminate possibilities and solve.'
    ],
    categories: ['brain']
  },
  [GAME_IDS.SNAKE_3D]: {
    id: GAME_IDS.SNAKE_3D,
    title: 'Snake 3D',
    description: 'Eat eggs to grow longer and avoid hitting the walls - classic snake game!',
    instructions: [
      "Swipe to change the snake's direction.",
      'Eat eggs to grow longer and score points.',
      'Avoid hitting the walls or your own tail.',
      'The snake moves faster as it grows.',
      'Survive as long as possible for a high score.'
    ],
    categories: ['arcade']
  },
  [GAME_IDS.PERFECT_CIRCLE]: {
    id: GAME_IDS.PERFECT_CIRCLE,
    title: 'Perfect Circle',
    description: 'Draw the most perfect circle you can on screen - test your hand precision!',
    instructions: [
      'Draw a circle on the screen with your finger.',
      'The closer to a perfect circle, the higher the score.',
      'Keep a steady hand and consistent speed.',
      'Try to connect the start and end points.',
      'Challenge yourself to beat your best score.'
    ],
    categories: ['casual']
  },
  [GAME_IDS.FRUIT_MERGER]: {
    id: GAME_IDS.FRUIT_MERGER,
    title: 'Fruit Merger',
    description: 'Drop and merge fruits to create bigger ones - reach the watermelon!',
    instructions: [
      'Tap to drop a fruit into the container.',
      'Two identical fruits merge into a larger one.',
      'Keep merging to create bigger fruits.',
      "Don't let fruits overflow past the top line.",
      'Aim for the highest score by merging strategically.'
    ],
    categories: ['casual', 'puzzle']
  },
  [GAME_IDS.FIND_DIFFERENT_NUMBER]: {
    id: GAME_IDS.FIND_DIFFERENT_NUMBER,
    title: 'Find Different Number',
    description: 'Find the 10 different numbers hidden in a 10×10 grid before time runs out!',
    instructions: [
      'A 10×10 grid of numbers is shown, 10 are different from the rest.',
      'Find and tap all 10 different numbers to advance to the next round.',
      'Each correct tap earns points. Finding all 10 adds bonus time.',
      'Numbers get trickier at higher rounds.',
      'Wrong taps lose 3 seconds — be accurate! You have 1 minute.'
    ],
    categories: ['education']
  },
  [GAME_IDS.BLUK]: {
    id: GAME_IDS.BLUK,
    title: 'Bluk',
    description: 'Sling your block from pillar to pillar - a skill-based physics jumping adventure!',
    instructions: [
      'Drag anywhere to aim - a dotted line predicts your jump arc.',
      'Release to launch your block toward the next pillar.',
      'Land safely on a pillar to score a point.',
      'Hit the glowing sweet spot for bonus points and combos.',
      'Miss the pillar and fall - the game is over!'
    ],
    categories: ['arcade', 'casual']
  },
  [GAME_IDS.CHAMELEON_RUN]: {
    id: GAME_IDS.CHAMELEON_RUN,
    title: 'Chameleon Run',
    description: 'Jump, switch colors and chase star streaks across a floating 3D sky course!',
    instructions: [
      'Run a fresh 500 m course at a steady pace. Cross the finish line to win.',
      'Swipe up to jump. Swipe up again in the air to double-jump.',
      'Tap anywhere to change between pink and yellow.',
      'Match your color to the platform: yellow has stripes, pink has dots. White platforms are always safe.',
      'You have three lives. A wrong color or missed jump costs a life, followed by a brief recovery period.',
      'Collect consecutive stars for a bonus multiplier up to 5x. Missing a star or taking a hit resets your streak.'
    ],
    categories: ['arcade', 'action']
  },
  [GAME_IDS.MOB_CONTROL]: {
    id: GAME_IDS.MOB_CONTROL,
    title: 'Mob Control',
    description: 'Command your mob through multiplier gates and overwhelm the enemy base to win!',
    instructions: [
      'Drag left and right to aim your cannon.',
      'Your cannon automatically launches individual blue soldiers.',
      'Chain blue addition and purple multiplier gates to grow your army. Red division gates shrink it.',
      'Blue and red soldiers cancel each other out. Intercept enemies before they breach your shield.',
      'The gold meter on your cannon charges a giant champion that launches automatically.',
      'Speed pads accelerate your troops; numbered barricades consume soldiers until broken.',
      'Each level is one battle. Capture all three towers and defeat any boss to clear it and unlock the next level.'
    ],
    categories: ['arcade', 'action', 'strategy']
  },
  [GAME_IDS.PAPER_IO]: {
    id: GAME_IDS.PAPER_IO,
    title: 'Paper IO',
    description: 'Claim territory, outmaneuver rivals and conquer the board in this classic io battle!',
    instructions: [
      'Swipe or drag to steer your block around the board.',
      'Leave your safe zone to draw a trail, then return to fill the area.',
      'Every loop you close is captured as your territory.',
      'Cut rivals by crossing their trail before they close it.',
      "Don't let anyone hit your trail - protect it and grow the biggest area!"
    ],
    categories: ['arcade', 'action', 'strategy']
  },
  [GAME_IDS.CROSSY_ROAD]: {
    id: GAME_IDS.CROSSY_ROAD,
    title: 'Crossy Road',
    description: 'Hop across busy roads, rivers and railways - how far can you go without getting squished?',
    instructions: [
      'Tap to hop forward one lane.',
      'Swipe left, right or down to move sideways or back.',
      'Dodge cars and trains on the roads.',
      "Ride floating logs to cross the rivers - don't fall in!",
      "Keep moving forward - don't let the screen leave you behind!"
    ],
    categories: ['arcade', 'action', 'casual']
  },
  [GAME_IDS.TANGRAM]: {
    id: GAME_IDS.TANGRAM,
    title: 'Tangram',
    description: 'Arrange the seven classic tans to perfectly fill the target shape - a timeless dissection puzzle!',
    instructions: [
      'Drag each colored tan onto the shaded silhouette.',
      'Tap a piece to rotate it by 45 degrees.',
      'Match a piece to its outline to lock it in place.',
      'Fill the whole silhouette to solve the puzzle.',
      'Beat the clock and earn bonus points for time left.'
    ],
    categories: ['puzzle', 'brain']
  },
  [GAME_IDS.CHECKERS]: {
    id: GAME_IDS.CHECKERS,
    title: 'Checkers',
    description: 'Outsmart the robot in the classic game of Checkers - capture all its pieces to win!',
    instructions: [
      'Tap one of your red pieces to select it.',
      'Tap a highlighted square to move diagonally.',
      "Jump over the robot's pieces to capture them.",
      'Chain multiple jumps in a single turn when you can.',
      'Reach the far row to crown a King that moves both ways.'
    ],
    categories: ['strategy', 'brain']
  },
  [GAME_IDS.MEMORY_MATCH]: {
    id: GAME_IDS.MEMORY_MATCH,
    title: 'Memory Match',
    description: 'Flip the cards two at a time and match every pair before the clock runs out!',
    instructions: [
      'Tap a card to flip it face up.',
      'Flip a second card to find its match.',
      'Matching pairs stay revealed.',
      'Mismatched cards flip back over - remember where they are!',
      'Clear the whole board before time runs out.'
    ],
    categories: ['brain', 'puzzle', 'education']
  },
  [GAME_IDS.FALLING_STICKS]: {
    id: GAME_IDS.FALLING_STICKS,
    title: 'Falling Sticks',
    description: 'Colorful sticks rain down from the sky - tap them before they hit the floor!',
    instructions: [
      'Sticks fall from the top of the screen.',
      'Tap a stick to catch it and score points.',
      'Let a stick reach the floor and you lose a life.',
      'You have three lives - the game speeds up as you score.',
      'Catch as many as you can for a high score!'
    ],
    categories: ['arcade', 'action', 'casual']
  },
  [GAME_IDS.REVERSI]: {
    id: GAME_IDS.REVERSI,
    title: 'Reversi',
    description: 'Outflank the robot in this classic Othello duel - trap its discs to flip them to your color!',
    instructions: [
      'You play black and move first.',
      'Place a disc so it traps a line of white discs between your discs.',
      'All trapped discs flip to black.',
      'If you have no valid move, your turn is skipped.',
      'When the board fills up, whoever has more discs wins!'
    ],
    categories: ['strategy', 'brain', 'puzzle']
  }
};

export const GAMES_METADATA_LIST = Object.values(GAMES_METADATA);
