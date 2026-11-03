import type { ComponentType } from 'react';
import { CarRacing, type GameProps } from '@nayan-engine-example/shared';

/** One card in the list; `Screen` is the shared game, opened at `/<id>`. */
export type Example = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
  Screen: ComponentType<GameProps>;
};

export const EXAMPLES: Example[] = [
  {
    id: 'car-racing',
    title: 'Car Racing',
    description: 'Dodge oncoming traffic and race through busy lanes - test your reflexes!',
    icon: '🏎️',
    color: '#E53935',
    tags: ['procedural city', 'day and night', 'effects', 'audio'],
    Screen: CarRacing
  }
];

export const findExample = (id?: string) => EXAMPLES.find((example) => example.id === id);
