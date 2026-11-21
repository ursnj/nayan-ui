'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import * as Engine from '@nayan-ui/engine/components';
import Code from '@/components/helpers/Code';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import { getMenuItem } from '@/services/Utils';
import { componentSource, standaloneExamples } from '@/services/engine/component-examples';
import { findComponentReference } from '@/services/engine/component-reference';

type Control = keyof typeof Engine;
type Spec = { control: Control; text?: string; props?: Record<string, unknown> };

const items = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'advanced', label: 'Advanced' }
];

const examples: Record<string, Spec> = {
  'action-item': { control: 'NActionItem', props: { name: 'Open document', description: 'View the latest draft.' } },
  avatar: { control: 'NImage', props: { src: '/logo.webp', alt: 'Nayan Engine', width: 48, height: 48, className: 'rounded-full' } },
  alert: { control: 'NAlert', props: { title: 'Ready', description: 'Your changes have been saved.' } },
  badge: { control: 'NBadge', text: 'New' },
  button: { control: 'NButton', text: 'Continue' },
  'button-group': { control: 'NButtonGroup', props: { items, defaultValue: 'beginner' } },
  card: { control: 'NCard', text: 'A themed surface for related content.', props: { className: 'p-4' } },
  'close-button': { control: 'NCloseButton', props: { accessibilityLabel: 'Close panel' } },
  code: { control: 'NCode', text: 'bun add @nayan-ui/engine' },
  checkbox: { control: 'NCheck', props: { label: 'Send notifications', defaultValue: true } },
  chip: { control: 'NChip', text: 'Engine' },
  'date-picker': { control: 'NDatePicker', props: { label: 'Date' } },
  disclosure: { control: 'NDisclosure', props: { title: 'Details' }, text: 'Expand the section to show its content.' },
  divider: { control: 'NDivider' },
  'empty-state': { control: 'NEmptyState', props: { title: 'No results', description: 'Try a different search.' } },
  icon: { control: 'NIcon', props: { paths: 'M4 12l5 5L20 6', strokeWidth: 2, size: 32 } },
  image: { control: 'NImage', props: { src: '/logo.webp', alt: 'Nayan Engine', width: 96, height: 68 } },
  input: { control: 'NInput', props: { label: 'Display name', placeholder: 'Ada' } },
  'input-otp': { control: 'NInputOtp', props: { label: 'Verification code', maxLength: 6 } },
  kbd: { control: 'NKbd', text: 'Enter' },
  link: { control: 'NLink', props: { href: '/game-engine' }, text: 'Engine documentation' },
  linkify: { control: 'NLinkify', props: { text: 'Find the documentation at https://www.nayanui.com/game-engine.' } },
  loading: { control: 'NLoading', props: { label: 'Loading data…' } },
  'menu-item': { control: 'NMenuItem', text: 'Open file' },
  'number-field': { control: 'NNumberField', props: { label: 'Amount', defaultValue: 2, min: 0, max: 10 } },
  press: {
    control: 'NPress',
    props: { accessibilityLabel: 'Press the custom control', className: 'rounded-lg bg-accent px-4 py-2 text-accent-foreground' },
    text: 'Press me'
  },
  progress: { control: 'NProgress', props: { label: 'Progress', value: 65, max: 100 } },
  radio: { control: 'NRadio', props: { label: 'Beginner', value: 'beginner', isSelected: true } },
  required: { control: 'NRequired', props: { isRequired: true } },
  'radio-group': { control: 'NRadioGroup', props: { label: 'Experience', items, defaultValue: 'beginner' } },
  'search-field': { control: 'NSearchField', props: { label: 'Search', placeholder: 'Search examples' } },
  select: { control: 'NSelect', props: { label: 'Experience', options: items, defaultValue: 'beginner' } },
  skeleton: { control: 'NSkeleton', props: { className: 'h-12 w-full rounded-xl' } },
  slider: { control: 'NSlider', props: { label: 'Volume', defaultValue: 50, min: 0, max: 100 } },
  switch: { control: 'NSwitch', props: { label: 'Enable sound', defaultValue: true } },
  tabs: { control: 'NTabs', props: { items, defaultValue: 'beginner' } },
  text: { control: 'NText', props: { className: 'text-xl font-semibold' }, text: 'Heading text' },
  view: { control: 'NView', props: { style: { width: 140, height: 64, backgroundColor: '#555ee6', borderRadius: 12 } } },
  pattern: {
    control: 'NPattern',
    props: { style: { width: 180, height: 120 }, recipe: { shapes: [{ kind: 'circle', cx: 90, cy: 60, r: 40, color: '#555ee6' }] } }
  },
  textarea: { control: 'NTextarea', props: { label: 'Notes', placeholder: 'Add a note' } },
  'toggle-button': { control: 'NToggleButton', text: 'Toggle' }
};

const related: Record<string, string> = {
  menu: 'menu-item',
  'avatar-group': 'avatar',
  breadcrumbs: 'link',
  calendar: 'date-picker',
  'checkbox-group': 'checkbox',
  'date-field': 'date-picker',
  'date-range-picker': 'date-picker',
  'infinite-scroll': 'list',
  'list-box': 'select',
  meter: 'progress',
  pagination: 'list',
  popover: 'select',
  'progress-circle': 'progress',
  'switch-group': 'switch',
  table: 'list',
  'tag-group': 'chip',
  'time-field': 'input',
  toolbar: 'button-group'
};

const dialogNames = { dialog: 'NDialog', sheet: 'NSheet', 'confirm-alert': 'NConfirm' } as const;
type DialogName = keyof typeof dialogNames;

export function componentPreview(slug: string) {
  if (slug === 'accordion') {
    return {
      source: componentSource(
        'NDisclosure, NText',
        `<NDisclosure title="Installation"><NText>Install the engine with Bun.</NText></NDisclosure>
          <NDisclosure title="Platforms"><NText>Build for the web, iOS and Android.</NText></NDisclosure>`
      ),
      render: (
        <>
          <Engine.NDisclosure title="Installation">
            <Engine.NText>Install the engine with Bun.</Engine.NText>
          </Engine.NDisclosure>
          <Engine.NDisclosure title="Platforms">
            <Engine.NText>Build for the web, iOS and Android.</Engine.NText>
          </Engine.NDisclosure>
        </>
      )
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
    const name = dialogNames[slug as DialogName];
    const body = name === 'NConfirm' ? ' onResult={(confirmed) => console.log(confirmed)} />' : `><NText>Details appear here.</NText></${name}>`;
    return {
      source: componentSource(
        `NButton, ${name}${name === 'NConfirm' ? '' : ', NText'}`,
        `<NButton onPress={() => setOpen(true)}>Open</NButton>
        <${name} isOpen={open} onOpenChange={setOpen} title="Details"${body}`,
        'const [open, setOpen] = useState(false);'
      ),
      render: <Presentation name={name} />
    };
  }
  const spec = examples[slug];
  if (!spec) return undefined;
  const Control = Engine[spec.control] as ComponentType<Record<string, unknown> & { children?: ReactNode }>;
  const attrs = Object.entries(spec.props ?? {})
    .map(([key, value]) => ` ${key}={${JSON.stringify(value)}}`)
    .join('');
  return {
    source: componentSource(spec.control, `<${spec.control}${attrs}${spec.text ? `>${spec.text}</${spec.control}>` : ' />'}`),
    render: <Control {...spec.props}>{spec.text}</Control>
  };
}

function Presentation({ name }: { name: (typeof dialogNames)[DialogName] }) {
  const [open, setOpen] = useState(false);
  const props = { isOpen: open, onOpenChange: setOpen, title: 'Details' };
  const Overlay = name === 'NSheet' ? Engine.NSheet : Engine.NDialog;
  return (
    <>
      <Engine.NButton onPress={() => setOpen(true)}>Open {name === 'NSheet' ? 'sheet' : 'dialog'}</Engine.NButton>
      {name === 'NConfirm' ? (
        <Engine.NConfirm
          {...props}
          description="Confirm this action?"
          onResult={(confirmed) => Engine.NToast.show(confirmed ? 'Confirmed' : 'Cancelled')}
        />
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
  const alternative = related[slug];
  const previewSlug = alternative ?? slug;
  const reference = findComponentReference(slug) ?? findComponentReference(previewSlug);
  const quickstart = path.startsWith('/react-native/') ? '/game-engine/react-native' : '/game-engine/react';

  return (
    <Sidebar title={item?.title ?? 'Components'}>
      {alternative && (
        <p className="mb-4 text-muted">This example uses the engine’s {alternative.replaceAll('-', ' ')} control as a starting point.</p>
      )}
      <EngineComponentExample slug={previewSlug} />
      {reference && (
        <Link href={reference.path} className="mb-4 block text-accent hover:underline">
          Engine reference for {reference.title}
        </Link>
      )}
      <Link href={quickstart} className="text-accent hover:underline">
        Set up engine components
      </Link>
    </Sidebar>
  );
}

export function EngineComponentExample({ slug }: { slug: string }) {
  const preview = componentPreview(slug);
  const example = standaloneExamples[slug];
  const code = preview?.source ?? example?.code;
  if (!code) return null;

  return (
    <>
      {preview && (
        <SubHeader title="Live example">
          <div className="docs-live-preview flex h-64 flex-col overflow-hidden rounded-xl border border-border bg-surface">
            <Engine.NPage className="gap-3 p-5 sm:p-6">{preview.render}</Engine.NPage>
          </div>
        </SubHeader>
      )}
      <SubHeader title="Usage" description={example?.note}>
        <Code code={code} filename="Example.tsx" />
      </SubHeader>
    </>
  );
}
