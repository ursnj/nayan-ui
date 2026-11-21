import { GAME_IDS, type GameCategory } from './UtilsService';

interface GameMetadata {
  id: GAME_IDS;
  title: string;
  description: string;
  instructions: string[];
  categories: GameCategory[];
  /** Catalog badge only; this does not restrict gameplay. */
  isPremium?: boolean;
}

export const GAMES_METADATA: Record<GAME_IDS, GameMetadata> = {
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
  }
};
