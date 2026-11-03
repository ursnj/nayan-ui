import type { ComponentType } from 'react';
import { CarRacing, type ExampleProps } from '@nayan-engine-example/shared';

/** One card in the list; `Screen` is the shared example, opened at `/<id>`. */
export type Example = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
  Screen: ComponentType<ExampleProps>;
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

export const findExample = (id?: string) => EXAMPLES.find((example) => example.id === id);
