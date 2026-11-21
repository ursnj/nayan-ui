import type { componentReferences } from '@/services/engine/component-reference';
import type { legacyComponentAlternatives } from './LegacyExamples';
import { controlScenarios } from './ControlScenarios';
import { interactiveScenarios } from './InteractiveScenarios';
import { hostScenarios } from './HostScenarios';
import { legacyScenarios } from './LegacyScenarios';
import { specializedScenarios } from './SpecializedScenarios';
import type { NamedComponentPreview } from './types';

type Slug = (typeof componentReferences)[number]['slug'] | keyof typeof legacyComponentAlternatives | 'avatar';

const examples = {
  ...controlScenarios,
  ...interactiveScenarios,
  ...hostScenarios,
  ...legacyScenarios,
  ...specializedScenarios
} satisfies Record<Slug, NamedComponentPreview>;

export function additionalExample(slug: string): NamedComponentPreview | undefined {
  return Object.hasOwn(examples, slug) ? examples[slug as Slug] : undefined;
}
