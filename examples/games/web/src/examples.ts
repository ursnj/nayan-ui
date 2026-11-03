import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { GameProps } from '@nayan-engine-example/shared';

/** One card in the list; `Screen` is the shared game, opened at `/<id>` and downloaded then. */
export type Example = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
  Screen: LazyExoticComponent<ComponentType<GameProps>>;
};

export const EXAMPLES: Example[] = [
  {
    id: 'car-racing',
    title: 'Car Racing',
    description: 'Dodge oncoming traffic and race through busy lanes - test your reflexes!',
    icon: '🏎️',
    color: '#E53935',
    tags: ['procedural city', 'day and night', 'effects', 'audio'],
    Screen: lazy(() => import('@nayan-engine-example/shared').then((m) => ({ default: m.CarRacing })))
  }
];

export const findExample = (id?: string) => EXAMPLES.find((example) => example.id === id);
