import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { GameProps } from '@nayan-engine-example/shared';

export type Example = {
  id: string;
  title: string;
  description: string;
  Screen: LazyExoticComponent<ComponentType<GameProps>>;
};

export const EXAMPLES: Example[] = [
  {
    id: 'car-racing',
    title: 'Car Racing',
    description: 'Dodge oncoming traffic and race through busy lanes.',
    Screen: lazy(() => import('@nayan-engine-example/shared').then((m) => ({ default: m.CarRacing })))
  }
];

export const findExample = (id?: string) => EXAMPLES.find((example) => example.id === id);
