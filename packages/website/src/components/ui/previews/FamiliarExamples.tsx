'use client';

import { useState } from 'react';
import {
  NAlert,
  NBadge,
  NButton,
  NButtonGroup,
  NCheck,
  NChip,
  NDivider,
  NEmptyState,
  NIcon,
  NInput,
  NProgress,
  NRequired,
  NSkeleton,
  NTabs,
  NTabsContent,
  NText,
  NTheme,
  NView
} from '@nayan-ui/engine/components';
import { componentSource } from '@/services/engine/component-examples';
import { AccordionRows, DisclosureRow } from './DisclosureExamples';
import { RadioOption, RadioOptions } from './RadioExamples';
import SwitchRows from './SwitchRows';
import type { ComponentPreview } from './types';

const buttonStyles = 'engine-preview-action';
const outlineButton = 'engine-preview-action engine-preview-action-outline';
const row = 'flex flex-row flex-wrap items-center gap-2';

function Buttons() {
  const [pressed, setPressed] = useState('');
  return (
    <NView className="component-host-demo">
      <NView className={row}>
        <NButton className={buttonStyles} onPress={() => setPressed('Primary')}>
          Primary
        </NButton>
        <NButton className={`${outlineButton} bg-surface-secondary`} onPress={() => setPressed('Secondary')}>
          Secondary
        </NButton>
        <NButton className={outlineButton} isOutline onPress={() => setPressed('Outline')}>
          Outline
        </NButton>
        <NButton className={`${buttonStyles} engine-preview-action-danger`} onPress={() => setPressed('Danger')}>
          Danger
        </NButton>
        <NButton className={`${buttonStyles} engine-preview-action-ghost`} onPress={() => setPressed('Ghost')}>
          Ghost
        </NButton>
        <NButton className={buttonStyles} isLoading disabled>
          Loading…
        </NButton>
        <NButton className={buttonStyles} disabled>
          Disabled
        </NButton>
      </NView>
      <NText tag="p" className="font-mono text-xs font-semibold text-accent">
        {pressed ? `${pressed} pressed` : 'Press a button to see the result.'}
      </NText>
    </NView>
  );
}

const alerts = [
  { title: 'Default', type: 'default', tone: 'text-muted', icon: 'M12 8v4m0 4h.01' },
  { title: 'Info', type: 'info', tone: 'text-accent', icon: 'M12 11v5m0-8h.01' },
  { title: 'Success', type: 'success', tone: 'text-success', icon: 'M8 12 2.5 2.5L16 9' },
  { title: 'Warning', type: 'warning', tone: 'text-warning', icon: 'M12 7v6m0 4h.01' },
  { title: 'Error', type: 'error', tone: 'text-danger', icon: 'M9 9 6 6m0-6-6 6' }
];
const outlineIcon = 'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0Z';

function Alerts() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  return (
    <>
      {alerts
        .filter(({ type }) => !dismissed.includes(type))
        .map(({ title, type, tone, icon }) => (
          <NAlert key={type} type={type} className="flex w-full flex-row items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
            <NIcon paths={`${outlineIcon} ${icon}`} className={tone} size={21} strokeWidth={1.8} />
            <NView className="flex min-w-0 flex-1 flex-col gap-1">
              <NText tag="p" className="text-sm font-semibold">
                {title}
              </NText>
              <NText tag="p" className="text-sm text-muted">
                New version available!
              </NText>
            </NView>
            <NButton
              className="engine-preview-action engine-preview-action-ghost w-11"
              accessibilityLabel={`Dismiss ${title.toLowerCase()} alert`}
              onPress={() => setDismissed((previous) => [...previous, type])}
            >
              ×
            </NButton>
          </NAlert>
        ))}
      {dismissed.length > 0 && (
        <NButton className={`${outlineButton} self-start`} onPress={() => setDismissed([])}>
          Restore alerts
        </NButton>
      )}
    </>
  );
}

const questions = [
  { title: 'What is Nayan UI?', text: 'Nayan Engine provides UI components, games and tools for React and React Native.' },
  { title: 'How to install?', text: 'Install the engine with Bun.' },
  { title: 'Is it free?', text: 'Yes. Nayan Engine is free and open source.' }
];

const selectionThemes = {
  light: { accent: '#eadefc' },
  dark: { accent: '#443364' }
};

const tabs = [
  { label: 'Account', value: 'account', text: 'Account settings content.' },
  { label: 'Security', value: 'security', text: 'Security settings content.' },
  { label: 'Notifications', value: 'notifications', text: 'Notification preferences.' }
];

function Tabs() {
  const [tab, setTab] = useState('account');
  return (
    <NTheme themes={selectionThemes}>
      <NTabs items={tabs} value={tab} onValueChange={setTab}>
        {tabs.map(({ value, text }) => (
          <NTabsContent key={value} item={value}>
            <NView className="mt-2 w-full rounded-xl border border-border bg-surface p-3">
              <NText className="text-sm text-muted">{text}</NText>
            </NView>
          </NTabsContent>
        ))}
      </NTabs>
    </NTheme>
  );
}

const alignments = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' }
];

function ButtonGroup() {
  const [alignment, setAlignment] = useState('left');
  return (
    <NTheme themes={selectionThemes}>
      <NButtonGroup items={alignments} value={alignment} onValueChange={setAlignment} />
      <NView className="w-full rounded-lg border border-border bg-surface p-3">
        <NText className="text-sm text-muted" style={{ textAlign: alignment as 'left' | 'center' | 'right' }}>
          Text alignment
        </NText>
      </NView>
    </NTheme>
  );
}

const tones = [
  { color: 'default', label: 'Default', classes: 'bg-default text-default-foreground' },
  { color: 'accent', label: 'Accent', classes: 'bg-accent text-accent-foreground' },
  { color: 'success', label: 'Success', classes: 'bg-success text-success-foreground' },
  { color: 'warning', label: 'Warning', classes: 'bg-warning text-warning-foreground' },
  { color: 'danger', label: 'Danger', classes: 'bg-danger text-danger-foreground' }
];

function BadgeAndChip({ chip }: { chip: boolean }) {
  const Control = chip ? NChip : NBadge;
  const shape = chip ? 'rounded-full' : 'rounded-md';
  return (
    <>
      <NText className="font-semibold">Colors</NText>
      <NView className={row}>
        {tones.map(({ color, label, classes }) => (
          <Control key={color} color={color} className={`${shape} ${classes} px-2 py-1`}>
            {label}
          </Control>
        ))}
      </NView>
      <NText className="font-semibold">Variants</NText>
      <NView className={row}>
        <Control color="accent" variant="primary" className={`${shape} bg-accent px-2 py-1 text-accent-foreground`}>
          Primary
        </Control>
        <Control color="accent" variant="secondary" className={`${shape} border border-accent px-2 py-1 text-accent`}>
          Secondary
        </Control>
        {chip && (
          <Control color="accent" variant="tertiary" className={`${shape} px-2 py-1 text-accent`}>
            Tertiary
          </Control>
        )}
        <Control color="accent" variant="soft" className={`${shape} bg-default px-2 py-1 text-accent`}>
          Soft
        </Control>
      </NView>
      <NText className="font-semibold">Sizes</NText>
      <NView className={row}>
        <Control color="accent" size="sm" className={`${shape} bg-accent px-2 py-1 text-xs text-accent-foreground`}>
          Small
        </Control>
        <Control color="accent" size="md" className={`${shape} bg-accent px-3 py-1 text-sm text-accent-foreground`}>
          Medium
        </Control>
        <Control color="accent" size="lg" className={`${shape} bg-accent px-3 py-2 text-base text-accent-foreground`}>
          Large
        </Control>
      </NView>
    </>
  );
}

const tabsPreview = {
  render: <Tabs />,
  source: componentSource(
    'NTabs, NTabsContent, NText',
    `<NTabs items={tabs} value={tab} onValueChange={setTab}>
            {tabs.map(({ value, text }) => (
              <NTabsContent key={value} item={value}>
                <NView className="w-full rounded-xl border border-border bg-surface p-3"><NText>{text}</NText></NView>
              </NTabsContent>
            ))}
          </NTabs>`,
    `const tabs = ${JSON.stringify(tabs, null, 2)};\n  const [tab, setTab] = useState('account');`
  )
};

function badgeAndChipExample(chip: boolean): ComponentPreview {
  const name = chip ? 'NChip' : 'NBadge';
  return {
    height: 310,
    render: <BadgeAndChip chip={chip} />,
    source: componentSource(
      `${name}, NText`,
      `<NText>Colors</NText>
          <NView className="${row}">
            <${name} color="default">Default</${name}>
            <${name} color="accent">Accent</${name}>
            <${name} color="success">Success</${name}>
            <${name} color="warning">Warning</${name}>
            <${name} color="danger">Danger</${name}>
          </NView>
          <NText>Variants</NText>
          <NView className="${row}">
            <${name} color="accent" variant="primary">Primary</${name}>
            <${name} color="accent" variant="secondary">Secondary</${name}>${chip ? `\n            <${name} color="accent" variant="tertiary">Tertiary</${name}>` : ''}
            <${name} color="accent" variant="soft">Soft</${name}>
          </NView>
          <NText>Sizes</NText>
          <NView className="${row}">
            <${name} color="accent" size="sm">Small</${name}>
            <${name} color="accent" size="md">Medium</${name}>
            <${name} color="accent" size="lg">Large</${name}>
          </NView>`
    )
  };
}

const examples: Readonly<Record<string, ComponentPreview>> = {
  alert: {
    height: 428,
    styled: true,
    render: <Alerts />,
    source: componentSource(
      'NAlert, NButton, NIcon, NText',
      `{alerts.filter(({ type }) => !dismissed.includes(type)).map(({ title, type, tone, icon }) => (
            <NAlert key={type} type={type} className="flex w-full flex-row items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
              <NIcon paths={\`\${outlineIcon} \${icon}\`} className={tone} size={21} strokeWidth={1.8} />
              <NView className="flex min-w-0 flex-1 flex-col gap-1">
                <NText className="text-sm font-semibold">{title}</NText>
                <NText className="text-sm text-muted">New version available!</NText>
              </NView>
              <NButton className="rounded-lg bg-transparent text-accent" accessibilityLabel={\`Dismiss \${title.toLowerCase()} alert\`}
                onPress={() => setDismissed((previous) => [...previous, type])}>×</NButton>
            </NAlert>
          ))}
          {dismissed.length > 0 && <NButton isOutline onPress={() => setDismissed([])}>Restore alerts</NButton>}`,
      `const outlineIcon = ${JSON.stringify(outlineIcon)};
  const alerts = ${JSON.stringify(alerts, null, 2)};
  const [dismissed, setDismissed] = useState<string[]>([]);`
    )
  },
  accordion: {
    host: true,
    height: 'auto',
    render: <AccordionRows />,
    source: componentSource(
      'NDisclosure, NText',
      `<NText>Single</NText>
          {questions.map(({ title, text }) => (
            <NDisclosure key={title} title={title} expanded={selected === title}
              onExpandedChange={(open) => setSelected(open ? title : null)}>
              <NText>{text}</NText>
            </NDisclosure>
          ))}
          <NText>Multiple</NText>
          {questions.map(({ title, text }) => (
            <NDisclosure key={title} title={title}><NText>{text}</NText></NDisclosure>
          ))}`,
      `const questions = ${JSON.stringify(questions, null, 2)};\n  const [selected, setSelected] = useState<string | null>(null);`
    )
  },
  disclosure: {
    host: true,
    height: 'auto',
    render: <DisclosureRow />,
    source: componentSource('NDisclosure, NText', '<NDisclosure title="Details"><NText>Expand the section to show its content.</NText></NDisclosure>')
  },
  radio: {
    host: true,
    height: 'auto',
    render: <RadioOption />,
    source: componentSource('NRadio', `<NRadio items={[{ label: 'Beginner', value: 'beginner' }]} />`)
  },
  'radio-group': {
    host: true,
    height: 'auto',
    render: <RadioOptions />,
    source: componentSource(
      'NRadioGroup',
      `<NRadioGroup label="Experience" defaultValue="beginner" items={[
            { label: 'Beginner', value: 'beginner' },
            { label: 'Advanced', value: 'advanced' },
            { label: 'Expert (disabled)', value: 'expert', disabled: true }
          ]} />`
    )
  },
  badge: badgeAndChipExample(false),
  'button-group': {
    render: <ButtonGroup />,
    source: componentSource(
      'NButtonGroup, NText',
      `<NButtonGroup items={alignments} value={alignment} onValueChange={setAlignment} />
          <NText>Alignment: {alignment}</NText>`,
      `const alignments = ${JSON.stringify(alignments)};
  const [alignment, setAlignment] = useState('left');`
    )
  },
  divider: {
    render: (
      <NView className="w-full gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <NText className="text-sm font-semibold">Overview</NText>
        <NDivider />
        <NText className="text-sm text-muted">Additional details</NText>
      </NView>
    ),
    source: componentSource(
      'NDivider, NText',
      `<NText>Overview</NText>
          <NDivider />
          <NText>Additional details</NText>`
    )
  },
  'empty-state': {
    styled: true,
    height: 200,
    render: (
      <NEmptyState className="flex w-full flex-col items-center gap-2 rounded-xl border border-border bg-surface p-5">
        <NView className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
          <NIcon size={20} strokeWidth={2} className="text-accent" paths="M21 21l-5-5M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
        </NView>
        <NText tag="p" className="font-semibold">
          No results
        </NText>
        <NText tag="p" className="text-center text-sm text-muted">
          Try a different search.
        </NText>
      </NEmptyState>
    ),
    source: componentSource('NEmptyState', '<NEmptyState title="No results" description="Try a different search." />')
  },
  required: {
    render: (
      <NView className="w-full gap-2">
        <NView className={row}>
          <NText className="text-sm font-semibold">Display name</NText>
          <NRequired isRequired className="text-danger" />
        </NView>
        <NInput accessibilityLabel="Display name" required placeholder="Your name" />
      </NView>
    ),
    source: componentSource(
      'NInput, NRequired, NText',
      `<NView className="${row}"><NText>Display name</NText><NRequired isRequired /></NView>
          <NInput accessibilityLabel="Display name" required placeholder="Your name" />`
    )
  },
  checkbox: {
    render: (
      <>
        <NText className="font-semibold">Basic</NText>
        <NCheck label="Enable email notifications" defaultValue />
        <NCheck label="Receive marketing updates" />
        <NCheck label="I agree to the terms of service" />
        <NText className="font-semibold">Disabled</NText>
        <NCheck label="Disabled (checked)" checked disabled />
        <NCheck label="Disabled (unchecked)" disabled />
      </>
    ),
    source: componentSource(
      'NCheck, NText',
      `<NText>Basic</NText>
          <NCheck label="Enable email notifications" defaultValue />
          <NCheck label="Receive marketing updates" />
          <NCheck label="I agree to the terms of service" />
          <NText>Disabled</NText>
          <NCheck label="Disabled (checked)" checked disabled />
          <NCheck label="Disabled (unchecked)" disabled />`
    ),
    height: 300
  },
  button: {
    host: true,
    height: 'auto',
    render: <Buttons />,
    source: componentSource(
      'NButton, NText',
      `<NView className="${row}">
            <NButton className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" onPress={() => setPressed('Primary')}>Primary</NButton>
            <NButton className="rounded-lg bg-default px-4 py-2 text-sm font-semibold text-default-foreground" onPress={() => setPressed('Secondary')}>Secondary</NButton>
            <NButton className="rounded-lg px-4 py-2 text-sm font-semibold" isOutline onPress={() => setPressed('Outline')}>Outline</NButton>
            <NButton className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground" onPress={() => setPressed('Danger')}>Danger</NButton>
            <NButton className="rounded-lg bg-transparent px-4 py-2 text-sm font-semibold text-accent" onPress={() => setPressed('Ghost')}>Ghost</NButton>
            <NButton className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" isLoading disabled>Loading…</NButton>
            <NButton className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" disabled>Disabled</NButton>
          </NView>
          <NText tag="p" className="font-mono text-xs font-semibold text-accent">{pressed ? \`\${pressed} pressed\` : 'Press a button to see the result.'}</NText>`,
      "const [pressed, setPressed] = useState('');"
    )
  },
  chip: badgeAndChipExample(true),
  input: {
    styled: true,
    render: (
      <NView className="flex w-full flex-col gap-2">
        <NText tag="label" htmlFor="email-example" className="text-sm font-semibold">
          Email
        </NText>
        <NInput id="email-example" accessibilityLabel="Email" type="email" placeholder="you@example.com" className="engine-preview-input" />
      </NView>
    ),
    source: componentSource(
      'NInput, NText',
      `<NView className="flex w-full flex-col gap-2">
            <NText tag="label" htmlFor="email-example" className="text-sm font-semibold">Email</NText>
            <NInput id="email-example" accessibilityLabel="Email" type="email" placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-field-background px-3 py-2 text-sm" />
          </NView>`
    )
  },
  progress: {
    height: 194,
    render: (
      <>
        <NText className="font-semibold">Bar only</NText>
        <NProgress value={30} />
        <NText className="font-semibold">With a visible label</NText>
        <NProgress value={72} label="Uploading" showLabel />
      </>
    ),
    source: componentSource(
      'NProgress, NText',
      `<NText>Bar only</NText>
          <NProgress value={30} />
          <NText>With a visible label</NText>
          <NProgress value={72} label="Uploading" showLabel />`
    )
  },
  skeleton: {
    height: 240,
    render: (
      <>
        <NSkeleton className="h-4 w-3/4 rounded" />
        <NSkeleton className="h-4 w-1/2 rounded" />
        <NSkeleton className="h-32 w-full rounded-xl" />
      </>
    ),
    source: componentSource(
      'NSkeleton',
      `<NSkeleton className="h-4 w-3/4 rounded" />
          <NSkeleton className="h-4 w-1/2 rounded" />
          <NSkeleton className="h-32 w-full rounded-xl" />`
    )
  },
  switch: {
    host: true,
    height: 206,
    render: (
      <SwitchRows options={[{ label: 'Airplane Mode' }, { label: 'Wi-Fi', enabled: true }, { label: 'Bluetooth (disabled)', disabled: true }]} />
    ),
    source: componentSource(
      'NSwitch',
      `<NSwitch label="Airplane Mode" defaultValue={false} />
          <NSwitch label="Wi-Fi" defaultValue />
          <NSwitch label="Bluetooth (disabled)" disabled />`
    )
  },
  tabs: tabsPreview,
  'tabs-content': tabsPreview
};

export function familiarExample(slug: string): ComponentPreview | undefined {
  return Object.hasOwn(examples, slug) ? examples[slug] : undefined;
}
