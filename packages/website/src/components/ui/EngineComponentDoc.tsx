'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import * as Engine from '@nayan-ui/engine/components';
import Code from '@/components/helpers/Code';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { getMenuItem } from '@/services/Utils';
import { componentSource, standaloneExamples } from '@/services/engine/component-examples';
import { findComponentReference } from '@/services/engine/component-reference';
import { tagsForReference } from '@/services/engine/reference-tags';
import { familiarExample } from './previews/FamiliarExamples';
import { hostExample } from './previews/HostExamples';
import { legacyComponentAlternatives, legacyExample } from './previews/LegacyExamples';
import type { SpecializedSlug } from './previews/SpecializedExamples';
import type { ComponentPreview } from './previews/types';

const SpecializedExample = dynamic(() => import('./previews/SpecializedExamples'), {
  ssr: false,
  loading: () => (
    <p className="component-host-demo" role="status">
      Preparing preview…
    </p>
  )
});

const specializedHeights = {
  'animation-view': 280,
  'drawing-canvas': 340,
  'game-view': 300,
  joystick: 280,
  'markdown-view': 280,
  'video-player': 280
} satisfies Record<SpecializedSlug, number>;

const previewThemes = {
  light: {
    accent: '#0e63ee',
    action: '#0e63ee',
    'action-foreground': '#ffffff',
    'accent-foreground': '#ffffff',
    background: '#f8fafc',
    foreground: '#0f172a',
    surface: '#ffffff',
    default: '#e2e8f0',
    'field-background': '#ffffff',
    'field-border': '#cbd5e1',
    border: '#cbd5e1',
    focus: '#0e63ee'
  },
  dark: {
    accent: '#70a7ff',
    action: '#70a7ff',
    'action-foreground': '#101c35',
    'accent-foreground': '#101c35',
    background: '#111827',
    foreground: '#f1f5f9',
    surface: '#1e293b',
    default: '#334155',
    'field-background': '#1e293b',
    'field-border': '#475569',
    border: '#475569',
    focus: '#70a7ff'
  }
} satisfies Engine.NThemeProps['themes'];

type Control = keyof typeof Engine;
type Spec = { control: Control; text?: string; props?: Record<string, unknown>; result?: string; height?: number };

const items = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'advanced', label: 'Advanced' }
];

const examples: Record<string, Spec> = {
  'action-item': { control: 'NActionItem', props: { name: 'Open document', description: 'View the latest draft.' }, result: 'Document opened.' },
  avatar: { control: 'NImage', props: { src: '/logo.webp', alt: 'Nayan Engine', width: 48, height: 48, className: 'rounded-full' } },
  'button-group': { control: 'NButtonGroup', props: { items, defaultValue: 'beginner' } },
  card: { control: 'NCard', text: 'This is a sample card.', props: { className: 'w-full rounded-xl border border-border bg-surface p-4' } },
  'close-button': { control: 'NCloseButton', props: { accessibilityLabel: 'Close panel' }, result: 'Panel closed.' },
  code: { control: 'NCode', text: 'bun add @nayan-ui/engine' },
  'date-picker': { control: 'NDatePicker', props: { label: 'Date' }, height: 380 },
  disclosure: { control: 'NDisclosure', props: { title: 'Details' }, text: 'Expand the section to show its content.' },
  divider: { control: 'NDivider' },
  'empty-state': { control: 'NEmptyState', props: { title: 'No results', description: 'Try a different search.' } },
  icon: { control: 'NIcon', props: { paths: 'M4 12l5 5L20 6', strokeWidth: 2, size: 32 } },
  image: { control: 'NImage', props: { src: '/logo.webp', alt: 'Nayan Engine', width: 96, height: 68 } },
  'input-otp': { control: 'NInputOtp', props: { label: 'Verification code', maxLength: 6 } },
  kbd: { control: 'NKbd', text: 'Enter' },
  link: { control: 'NLink', props: { href: '/game-engine' }, text: 'Engine documentation' },
  linkify: { control: 'NLinkify', props: { text: 'Find the documentation at https://www.nayanui.com/game-engine.' } },
  loading: { control: 'NLoading', props: { label: 'Loading data…' } },
  'menu-item': { control: 'NMenuItem', text: 'Open file', result: 'File opened.' },
  'number-field': { control: 'NNumberField', props: { label: 'Amount', defaultValue: 2, min: 0, max: 10 } },
  press: {
    control: 'NPress',
    props: { accessibilityLabel: 'Press the custom control', className: 'self-start rounded-xl bg-accent px-4 py-2 text-accent-foreground' },
    text: 'Press me',
    result: 'Custom control pressed.'
  },
  radio: { control: 'NRadio', props: { label: 'Beginner', value: 'beginner', isSelected: true } },
  required: { control: 'NRequired', props: { isRequired: true } },
  'radio-group': { control: 'NRadioGroup', props: { label: 'Experience', items, defaultValue: 'beginner' } },
  'search-field': { control: 'NSearchField', props: { label: 'Search', placeholder: 'Search examples' } },
  select: { control: 'NSelect', props: { label: 'Experience', options: items, defaultValue: 'beginner' } },
  slider: { control: 'NSlider', props: { label: 'Volume', defaultValue: 50, min: 0, max: 100 } },
  text: { control: 'NText', props: { className: 'text-xl font-semibold' }, text: 'Heading text' },
  view: { control: 'NView', props: { style: { width: 140, height: 64, backgroundColor: '#555ee6', borderRadius: 12 } } },
  pattern: {
    control: 'NPattern',
    props: { style: { width: 180, height: 120 }, recipe: { shapes: [{ kind: 'circle', cx: 90, cy: 60, r: 40, color: '#555ee6' }] } }
  },
  textarea: { control: 'NTextarea', props: { label: 'Notes', placeholder: 'Add a note' } },
  'toggle-button': { control: 'NToggleButton', text: 'Toggle' }
};

const dialogNames = {
  dialog: { control: 'NDialog', action: 'Open Dialog', title: 'Example dialog' },
  sheet: { control: 'NSheet', action: 'Open Sheet', title: 'Example sheet' },
  'confirm-alert': { control: 'NConfirm', action: 'Show Confirm Alert', title: 'Are you absolutely sure?' }
} as const;
const confirmation = 'This will delete the example item.';
type DialogName = keyof typeof dialogNames;

export function componentPreview(slug: string): ComponentPreview | undefined {
  const preview = familiarExample(slug) ?? hostExample(slug) ?? legacyExample(slug);
  if (preview) return preview;

  if (Object.hasOwn(specializedHeights, slug)) {
    const specialized = slug as SpecializedSlug;
    const { code, note } = standaloneExamples[specialized]!;
    return {
      source: code,
      note,
      render: <SpecializedExample slug={specialized} />,
      height: specializedHeights[specialized],
      host: true
    };
  }
  if (slug === 'carousel') {
    return {
      source: componentSource(
        'NCarousel, NText, NView',
        `<NCarousel height={140}>
            <NView className="h-full w-full p-4"><NText>First slide</NText></NView>
            <NView className="h-full w-full p-4"><NText>Second slide</NText></NView>
          </NCarousel>`
      ),
      render: (
        <Engine.NCarousel height={140}>
          <Engine.NView className="h-full w-full p-4">
            <Engine.NText>First slide</Engine.NText>
          </Engine.NView>
          <Engine.NView className="h-full w-full p-4">
            <Engine.NText>Second slide</Engine.NText>
          </Engine.NView>
        </Engine.NCarousel>
      )
    };
  }
  if (slug === 'skeleton-group') {
    return {
      source: componentSource(
        'NSkeleton, NSkeletonGroup',
        '<NSkeletonGroup className="gap-3"><NSkeleton className="h-5 w-full" /><NSkeleton className="h-5 w-32" /></NSkeletonGroup>'
      ),
      render: (
        <Engine.NSkeletonGroup className="gap-3">
          <Engine.NSkeleton className="h-5 w-full" />
          <Engine.NSkeleton className="h-5 w-32" />
        </Engine.NSkeletonGroup>
      )
    };
  }
  if (slug === 'list')
    return {
      source: componentSource(
        'NList, NText',
        `<NList data={['Beginner', 'Advanced']} height={140} itemSize={40}
          keyExtractor={(item) => item} renderItem={({ item }) => <NText>{item}</NText>} />`
      ),
      render: (
        <Engine.NList
          data={items}
          height={140}
          itemSize={40}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => <Engine.NText className="p-2">{item.label}</Engine.NText>}
        />
      )
    };
  if (slug === 'tooltip')
    return {
      source: componentSource('NButton, NTooltip', '<NTooltip message="More information"><NButton>Details</NButton></NTooltip>'),
      render: (
        <Engine.NTooltip message="More information">
          <Engine.NButton>Details</Engine.NButton>
        </Engine.NTooltip>
      )
    };
  if (slug === 'scroll-shadow')
    return {
      source: componentSource(
        'NScrollShadow, NText',
        `<NScrollShadow height={120}>
          {Array.from({ length: 12 }, (_, index) => <NText key={index}>Row {index + 1}</NText>)}
        </NScrollShadow>`
      ),
      render: (
        <Engine.NScrollShadow height={120}>
          {Array.from({ length: 12 }, (_, index) => (
            <Engine.NText key={index}>Row {index + 1}</Engine.NText>
          ))}
        </Engine.NScrollShadow>
      )
    };
  if (slug === 'toast')
    return {
      source: componentSource('NButton, NToast', "<NButton onPress={() => NToast.success('Changes saved')}>Show toast</NButton>"),
      render: <Engine.NButton onPress={() => Engine.NToast.success('Changes saved')}>Show toast</Engine.NButton>
    };
  if (Object.hasOwn(dialogNames, slug)) {
    const { control, action, title } = dialogNames[slug as DialogName];
    const body =
      control === 'NConfirm'
        ? ` description="${confirmation}" onResult={(confirmed) => NToast.show(confirmed ? 'Confirmed' : 'Cancelled')} />`
        : `><NText>Details appear here.</NText></${control}>`;
    return {
      source: componentSource(
        `NButton, ${control}, ${control === 'NConfirm' ? 'NToast' : 'NText'}`,
        `<NButton onPress={() => setOpen(true)}>${action}</NButton>
        <${control} isOpen={open} onOpenChange={setOpen} title="${title}"${body}`,
        'const [open, setOpen] = useState(false);'
      ),
      render: <Presentation kind={slug as DialogName} />
    };
  }
  const spec = examples[slug];
  if (!spec) return undefined;
  const Control = Engine[spec.control] as ComponentType<Record<string, unknown> & { children?: ReactNode }>;
  const attrs = Object.entries(spec.props ?? {})
    .map(([key, value]) => ` ${key}={${JSON.stringify(value)}}`)
    .join('');
  const trigger = spec.result ? ' onPress={() => setPressed(true)}' : '';
  const child = spec.text ? `>${spec.text}</${spec.control}>` : ' />';
  const feedback = spec.result ? `\n          {pressed && <NText>${spec.result}</NText>}` : '';
  return {
    source: componentSource(
      spec.result ? `${spec.control}, NText` : spec.control,
      `<${spec.control}${attrs}${trigger}${child}${feedback}`,
      spec.result ? 'const [pressed, setPressed] = useState(false);' : undefined
    ),
    render: spec.result ? <ActionPreview control={Control} spec={spec} /> : <Control {...spec.props}>{spec.text}</Control>,
    height: spec.height
  };
}

function ActionPreview({ control: Control, spec }: { control: ComponentType<Record<string, unknown> & { children?: ReactNode }>; spec: Spec }) {
  const [pressed, setPressed] = useState(false);
  return (
    <>
      <Control {...spec.props} onPress={() => setPressed(true)}>
        {spec.text}
      </Control>
      {pressed && <Engine.NText>{spec.result}</Engine.NText>}
    </>
  );
}

function Presentation({ kind }: { kind: DialogName }) {
  const [open, setOpen] = useState(false);
  const { control, action, title } = dialogNames[kind];
  const props = { isOpen: open, onOpenChange: setOpen, title };
  const Overlay = control === 'NSheet' ? Engine.NSheet : Engine.NDialog;
  return (
    <>
      <Engine.NButton onPress={() => setOpen(true)}>{action}</Engine.NButton>
      {control === 'NConfirm' ? (
        <Engine.NConfirm {...props} description={confirmation} onResult={(confirmed) => Engine.NToast.show(confirmed ? 'Confirmed' : 'Cancelled')} />
      ) : (
        <Overlay {...props}>
          <Engine.NText>Details appear here.</Engine.NText>
        </Overlay>
      )}
    </>
  );
}

export default function EngineComponentDoc({ path }: { path: string }) {
  const item = getMenuItem(path);
  const slug = path.substring(path.lastIndexOf('/') + 1);
  const alternative = legacyComponentAlternatives[slug as keyof typeof legacyComponentAlternatives];
  const reference = findComponentReference(alternative ?? (slug === 'avatar' ? 'image' : slug));
  const quickstart = path.startsWith('/react-native/') ? '/game-engine/react-native' : '/game-engine/react';
  const tags = tagsForReference(path);

  return (
    <Sidebar title={item?.title ?? 'Components'}>
      <EngineComponentExample slug={slug} />
      {reference && (
        <Link href={reference.path} className="mb-4 block text-accent hover:underline">
          Engine reference for {reference.title}
        </Link>
      )}
      <Link href={quickstart} className="mb-6 block text-accent hover:underline">
        Set up engine components
      </Link>
      {tags.length > 0 && (
        <SubHeader title="Tags">
          <TagsList tags={tags} />
        </SubHeader>
      )}
    </Sidebar>
  );
}

export function EngineComponentExample({ slug }: { slug: string }) {
  const preview = componentPreview(slug);
  if (!preview) return null;

  return (
    <>
      <SubHeader title="Live example">
        <div
          className="docs-live-preview flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface"
          data-component-preview={slug}
          style={{ height: preview.height ?? 256 }}
        >
          <ExampleStage key={slug} preview={preview} />
        </div>
      </SubHeader>
      <SubHeader title="Usage" description={preview.note}>
        <Code code={preview.source} filename="Example.tsx" />
      </SubHeader>
    </>
  );
}

function ExampleStage({ preview }: { preview: ComponentPreview }) {
  const [rendererError, setRendererError] = useState(false);
  return (
    <Engine.NTheme themes={previewThemes}>
      {preview.host ? (
        preview.render
      ) : rendererError ? (
        <p className="component-host-demo" role="status">
          The engine renderer could not start in this browser.
        </p>
      ) : (
        <Engine.NPage className="gap-3 p-4" onError={() => setRendererError(true)}>
          {preview.render}
        </Engine.NPage>
      )}
    </Engine.NTheme>
  );
}
