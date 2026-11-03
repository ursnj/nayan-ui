import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ExampleProps } from '@nayan-engine-example/shared';

/** One card in the list; `Screen` is the shared example, opened at `/<id>` and downloaded then. */
export type Example = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
  Screen: LazyExoticComponent<ComponentType<ExampleProps>>;
};

export const EXAMPLES: Example[] = [
  {
    id: 'car-racing',
    title: 'Car Racing',
    description: 'Overtake traffic down a three-lane road to the finish, with three lives.',
    icon: '🏎️',
    color: '#E53935',
    tags: ['glTF models', 'chase camera', 'effects', 'audio'],
    Screen: lazy(() => import('@nayan-engine-example/shared').then((m) => ({ default: m.CarRacing })))
  }
];

export const findExample = (id?: string) => EXAMPLES.find((example) => example.id === id);
