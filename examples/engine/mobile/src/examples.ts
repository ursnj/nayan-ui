import type { ComponentType } from 'react';
import { CarRacing } from '@nayan-engine-example/shared';

/** One card in the gallery; `Screen` is the shared example component. */
export type Example = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
  Screen: ComponentType;
};

export const EXAMPLES: Example[] = [
  {
    id: 'car-racing',
    title: 'Car Racing',
    description: 'Overtake traffic down a three-lane road to the finish, with three lives.',
    icon: '🏎️',
    color: '#E53935',
    tags: ['glTF models', 'chase camera', 'effects', 'audio'],
    Screen: CarRacing
  }
];
