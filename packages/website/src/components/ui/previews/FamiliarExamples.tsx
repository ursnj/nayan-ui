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
  NInput,
  NProgress,
  NRequired,
  NSkeleton,
  NTabs,
  NTabsContent,
  NText,
  NView
} from 'nayan-ui/components';
import { SearchIcon } from 'nayan-ui/icons/components/search';
import { componentSource } from '@/services/nayan-ui/component-examples';
import { AccordionRows, accordionSource } from './AccordionExamples';
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
        <NButton className={outlineButton} isOutline onPress={() => setPressed('Outline')}>
          Outline
        </NButton>
        <NButton className={buttonStyles} isLoading>Save</NButton>
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
  { title: 'Alert', type: 'default', message: 'Review your notification settings.' },
  { title: 'Information', type: 'info', message: 'New version available!' },
  { title: 'Success', type: 'success', message: 'Your changes were saved.' },
  { title: 'Warning', type: 'warning', message: 'Your session expires soon.' },
  { title: 'Error', type: 'error', message: 'Could not save your changes.' }
];
const restoreAlertsClass =
  'min-h-11 self-start rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-secondary';

function Alerts() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  return (
    <>
      {alerts
        .filter(({ type }) => !dismissed.includes(type))
        .map(({ title, type, message }) => (
          <NAlert
            key={type}
            type={type}
            title={title}
            message={message}
            onClose={() => setDismissed((previous) => [...previous, type])}
          />
        ))}
      {dismissed.length > 0 && (
        <NButton className={restoreAlertsClass} onPress={() => setDismissed([])}>
          Restore alerts
        </NButton>
      )}
    </>
  );
}

const tabs = [
  { label: 'Account', value: 'account', text: 'Account settings content.' },
  { label: 'Security', value: 'security', text: 'Security settings content.' },
  { label: 'Notifications', value: 'notifications', text: 'Notification preferences.' }
];

function Tabs() {
  const [tab, setTab] = useState('account');
  return (
    <NTabs items={tabs} value={tab} onValueChange={setTab}>
      {tabs.map(({ value, text }) => (
        <NTabsContent key={value} item={value}>
          <NView className="mt-2 w-full rounded-xl border border-border bg-surface p-3">
            <NText className="text-sm text-muted">{text}</NText>
          </NView>
        </NTabsContent>
      ))}
    </NTabs>
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
    <>
      <NButtonGroup items={alignments} value={alignment} onValueChange={setAlignment} />
      <NView className="w-full rounded-lg border border-border bg-surface p-3">
        <NText className="text-sm text-muted" style={{ textAlign: alignment as 'left' | 'center' | 'right' }}>
          Text alignment
        </NText>
      </NView>
    </>
  );
}

const tones = [
  { color: 'default', label: 'Default' },
  { color: 'accent', label: 'Accent' },
  { color: 'success', label: 'Success' },
  { color: 'warning', label: 'Warning' },
  { color: 'danger', label: 'Danger' }
];

function BadgeAndChip({ chip }: { chip: boolean }) {
  const Control = chip ? NChip : NBadge;
  return (
    <>
      <NText className="font-semibold">Colors</NText>
      <NView className={row}>
        {tones.map(({ color, label }) => (
          <Control key={color} color={color}>
            {label}
          </Control>
        ))}
      </NView>
      <NText className="font-semibold">Variants</NText>
      <NView className={row}>
        <Control color="accent" variant="primary">
          Primary
        </Control>
        <Control color="accent" variant="secondary">
          Secondary
        </Control>
        {chip && (
          <Control color="accent" variant="tertiary">
            Tertiary
          </Control>
        )}
        <Control color="accent" variant="soft">
          Soft
        </Control>
      </NView>
      <NText className="font-semibold">Sizes</NText>
      <NView className={row}>
        <Control color="accent" size="sm">
          Small
        </Control>
        <Control color="accent" size="md">
          Medium
        </Control>
        <Control color="accent" size="lg">
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
    render: <Alerts />,
    source: componentSource(
      'NAlert, NButton',
      `{alerts.filter(({ type }) => !dismissed.includes(type)).map(({ title, type, message }) => (
            <NAlert key={type} type={type} title={title} message={message}
              onClose={() => setDismissed((previous) => [...previous, type])} />
          ))}
          {dismissed.length > 0 && <NButton className="${restoreAlertsClass}" onPress={() => setDismissed([])}>Restore alerts</NButton>}`,
      `const alerts = ${JSON.stringify(alerts, null, 2)};
  const [dismissed, setDismissed] = useState<string[]>([]);`,
      304,
      'flex flex-col gap-4 p-5'
    )
  },
  accordion: {
    host: true,
    height: 'auto',
    render: <AccordionRows />,
    source: accordionSource
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
    height: 200,
    render: (
      <NEmptyState className="flex w-full flex-col items-center gap-2 rounded-xl border border-border bg-surface p-5">
        <NView className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
          <SearchIcon size={20} className="text-accent" />
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
            <NButton className="rounded-lg px-4 py-2 text-sm font-semibold" isOutline onPress={() => setPressed('Outline')}>Outline</NButton>
            <NButton isLoading>Save</NButton>
            <NButton className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" disabled>Disabled</NButton>
          </NView>
          <NText tag="p" className="font-mono text-xs font-semibold text-accent">{pressed ? \`\${pressed} pressed\` : 'Press a button to see the result.'}</NText>`,
      "const [pressed, setPressed] = useState('');"
    )
  },
  chip: badgeAndChipExample(true),
  input: {
    render: (
      <NInput id="email-example" label="Email" type="email" placeholder="you@example.com" helperText="Use your work email address." />
    ),
    source: componentSource(
      'NInput',
      `<NInput id="email-example" label="Email" type="email" placeholder="you@example.com"
            helperText="Use your work email address." />`
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
