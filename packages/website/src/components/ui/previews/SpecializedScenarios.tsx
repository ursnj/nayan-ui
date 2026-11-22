import { PREVIEW_STACK } from '@/design/system';
import { NText } from 'nayan-ui/components';
import dynamic from 'next/dynamic';
import { standaloneExamples } from '@/services/nayan-ui/component-examples';
import type { SpecializedSlug } from './SpecializedExamples';
import type { ComponentPreview, NamedComponentPreview } from './types';

const SpecializedExample = dynamic(() => import('./SpecializedExamples'), {
  ssr: false,
  loading: () => (
    <NText tag="p" className={PREVIEW_STACK} role="status">
      Preparing preview…
    </NText>
  )
});

const heights = {
  'animation-view': 280,
  'drawing-canvas': 340,
  'game-view': 300,
  joystick: 280,
  'markdown-view': 280,
  'video-player': 280
} satisfies Record<SpecializedSlug, number>;

export function specializedExample(slug: string): ComponentPreview | undefined {
  if (!Object.hasOwn(heights, slug)) return;
  const entry = slug as SpecializedSlug;
  const { code, note } = standaloneExamples[entry]!;
  return { source: code, note, render: <SpecializedExample slug={entry} />, height: heights[entry], host: true };
}

function media(slug: SpecializedSlug, title: string, source: string): NamedComponentPreview {
  return { title, source, render: <SpecializedExample slug={slug} alternate />, height: heights[slug], host: true };
}

const original = (slug: SpecializedSlug) => standaloneExamples[slug]!.code;

export const specializedScenarios = {
  'animation-view': media(
    'animation-view',
    'One-second fade',
    original('animation-view').replace('withTiming(faded ? 1 : 0.4)', 'withTiming(faded ? 1 : 0.4, { duration: 1000 })')
  ),
  'drawing-canvas': media(
    'drawing-canvas',
    'Thick marker brush',
    original('drawing-canvas').replace("color: '#1864e8', width: 8", "color: '#bf2786', width: 16")
  ),
  'game-view': media('game-view', 'Perspective camera', original('game-view').replace(', ortho: 1.25', '')),
  joystick: media('joystick', 'Compact joystick', original('joystick').replace('size={120}', 'size={84}')),
  'markdown-view': media(
    'markdown-view',
    'Quotes and numbered lists',
    `'use client';

import { NTheme } from 'nayan-ui/components';
import { NMarkdown } from 'nayan-ui/markdown';

const source = '## Launch notes\\n\\n> Ship small, test often.\\n\\n1. Build the app\\n2. Review the release\\n3. Publish';

export default function Example() {
  return <NTheme className="p-4"><NMarkdown source={source} blockSpacing={12} /></NTheme>;
}`
  ),
  'video-player': media('video-player', 'Loop with cover fit', original('video-player').replace('contentFit="contain"', 'loop contentFit="cover"'))
};
