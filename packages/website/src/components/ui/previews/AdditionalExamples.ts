import type { componentReferences, legacyComponentAlternatives } from '@/services/nayan-ui/component-reference';
import { controlScenarios } from './ControlScenarios';
import { interactiveScenarios } from './InteractiveScenarios';
import { hostScenarios } from './HostScenarios';
import { legacyScenarios } from './LegacyScenarios';
import { pageFormExample, systemBarsToggleExample } from './PageExamples';
import { specializedScenarios } from './SpecializedScenarios';
import type { NamedComponentPreview } from './types';

type Slug = (typeof componentReferences)[number]['slug'] | keyof typeof legacyComponentAlternatives | 'avatar';

const examples = {
  ...controlScenarios,
  ...interactiveScenarios,
  ...hostScenarios,
  ...legacyScenarios,
  ...specializedScenarios,
  calendar: interactiveScenarios['date-picker'],
  page: pageFormExample,
  'use-system-bars': systemBarsToggleExample
} satisfies Record<Slug, NamedComponentPreview>;

export function additionalExample(slug: string): NamedComponentPreview | undefined {
  return Object.hasOwn(examples, slug) ? examples[slug as Slug] : undefined;
}
