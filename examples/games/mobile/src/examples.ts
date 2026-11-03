import type { ComponentType } from 'react';
import { CarRacing, type GameProps } from '@nayan-engine-example/shared';

export type Example = {
  id: string;
  title: string;
  description: string;
  Screen: ComponentType<GameProps>;
};

export const EXAMPLES: Example[] = [
  {
    id: 'car-racing',
    title: 'Car Racing',
    description: 'Dodge oncoming traffic and race through busy lanes.',
    Screen: CarRacing
  }
];

export const findExample = (id?: string) => EXAMPLES.find((example) => example.id === id);
