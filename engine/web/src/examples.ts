import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** One card in the gallery; `Screen` is the shared example, downloaded when it's first opened. */
export type Example = {
  /** Its URL hash: `#/car-racing`. */
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
  Screen: LazyExoticComponent<ComponentType>;
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
