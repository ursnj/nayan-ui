'use client';

import { useState } from 'react';
import {
  NAlert,
  NBadge,
  NButton,
  NCheck,
  NChip,
  NCloseButton,
  NDisclosure,
  NInput,
  NProgress,
  NSkeleton,
  NSwitch,
  NTabs,
  NTabsContent,
  NText,
  NView,
  useNTheme
} from '@nayan-ui/engine/components';
import { componentSource } from '@/services/engine/component-examples';
import type { ComponentPreview } from './types';

const buttonStyles = 'w-28 rounded-full px-3 py-2 font-semibold';
const row = 'flex-row flex-wrap items-center gap-2';

function Buttons() {
  const [pressed, setPressed] = useState('');
  return (
    <>
      <NView className={row}>
        <NButton className={buttonStyles} onPress={() => setPressed('Primary')}>
          Primary
        </NButton>
        <NButton className={`${buttonStyles} bg-default text-default-foreground`} onPress={() => setPressed('Secondary')}>
          Secondary
        </NButton>
        <NButton className={buttonStyles} isOutline onPress={() => setPressed('Outline')}>
          Outline
        </NButton>
        <NButton className={`${buttonStyles} bg-danger text-danger-foreground`} onPress={() => setPressed('Danger')}>
          Danger
        </NButton>
        <NButton className={`${buttonStyles} bg-transparent text-accent`} onPress={() => setPressed('Ghost')}>
          Ghost
        </NButton>
        <NButton className={buttonStyles} isLoading>
          Loading
        </NButton>
        <NButton className={buttonStyles} disabled>
          Disabled
        </NButton>
      </NView>
      <NText>{pressed ? `${pressed} pressed` : 'Press a button to see the result.'}</NText>
    </>
  );
}

const alerts = [
  { title: 'Default', type: 'default', light: '#f1f5f9', dark: '#273449' },
  { title: 'Info', type: 'info', light: '#dbeafe', dark: '#1d365a' },
  { title: 'Success', type: 'success', light: '#dcfce7', dark: '#184335' },
  { title: 'Warning', type: 'warning', light: '#fef3c7', dark: '#4c3b1e' },
  { title: 'Error', type: 'error', light: '#fee2e2', dark: '#512b39' }
];

function Alerts() {
  const { resolvedTheme } = useNTheme();
  const [dismissed, setDismissed] = useState<string[]>([]);
  return (
    <>
      {alerts
        .filter(({ type }) => !dismissed.includes(type))
        .map(({ title, type, light, dark }) => (
          <NView
            key={type}
            className="flex-row items-center rounded-xl px-3 py-1"
            style={{ backgroundColor: resolvedTheme === 'dark' ? dark : light }}
          >
            <NAlert className="min-w-0 flex-1" title={title} type={type} message="New version available!" />
            <NCloseButton
              className="self-center rounded-full bg-transparent text-foreground"
              accessibilityLabel={`Dismiss ${title.toLowerCase()} alert`}
              onPress={() => setDismissed((previous) => [...previous, type])}
            />
          </NView>
        ))}
      {dismissed.length > 0 && (
        <NButton className="self-start rounded-full" isOutline onPress={() => setDismissed([])}>
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

function Accordion() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <NText className="font-semibold">Single</NText>
      <NView className="w-full gap-1 rounded-xl border border-border bg-surface px-3 py-2">
        {questions.map(({ title, text }) => (
          <NDisclosure key={title} title={title} expanded={selected === title} onExpandedChange={(open) => setSelected(open ? title : null)}>
            <NText>{text}</NText>
          </NDisclosure>
        ))}
      </NView>
      <NText className="font-semibold">Multiple</NText>
      <NView className="w-full gap-1 rounded-xl border border-border bg-surface px-3 py-2">
        {questions.map(({ title, text }) => (
          <NDisclosure key={title} title={title}>
            <NText>{text}</NText>
          </NDisclosure>
        ))}
      </NView>
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
          <NView className="w-full rounded-xl border border-border bg-surface p-3">
            <NText>{text}</NText>
          </NView>
        </NTabsContent>
      ))}
    </NTabs>
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
    height: 455,
    render: <Alerts />,
    source: componentSource(
      'NAlert, NButton, NCloseButton, NText',
      `{alerts.filter(({ type }) => !dismissed.includes(type)).map(({ title, type, light }) => (
            <NView key={type} className="flex-row items-center rounded-xl px-3 py-1" style={{ backgroundColor: light }}>
              <NAlert className="min-w-0 flex-1" title={title} type={type} message="New version available!" />
              <NCloseButton className="rounded-full bg-transparent text-foreground" accessibilityLabel={\`Dismiss \${title.toLowerCase()} alert\`}
                onPress={() => setDismissed((previous) => [...previous, type])} />
            </NView>
          ))}
          {dismissed.length > 0 && <NButton isOutline onPress={() => setDismissed([])}>Restore alerts</NButton>}`,
      `const alerts = ${JSON.stringify(
        alerts.map(({ title, type, light }) => ({ title, type, light })),
        null,
        2
      )};\n  const [dismissed, setDismissed] = useState<string[]>([]);`
    )
  },
  accordion: {
    height: 530,
    render: <Accordion />,
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
  badge: badgeAndChipExample(false),
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
    height: 296,
    render: <Buttons />,
    source: componentSource(
      'NButton, NText',
      `<NView className="${row}">
            <NButton className="${buttonStyles}" onPress={() => setPressed('Primary')}>Primary</NButton>
            <NButton className="${buttonStyles} bg-default text-default-foreground" onPress={() => setPressed('Secondary')}>Secondary</NButton>
            <NButton className="${buttonStyles}" isOutline onPress={() => setPressed('Outline')}>Outline</NButton>
            <NButton className="${buttonStyles} bg-danger text-danger-foreground" onPress={() => setPressed('Danger')}>Danger</NButton>
            <NButton className="${buttonStyles} bg-transparent text-accent" onPress={() => setPressed('Ghost')}>Ghost</NButton>
            <NButton className="${buttonStyles}" isLoading>Loading</NButton>
            <NButton className="${buttonStyles}" disabled>Disabled</NButton>
          </NView>
          <NText>{pressed ? \`\${pressed} pressed\` : 'Press a button to see the result.'}</NText>`,
      "const [pressed, setPressed] = useState('');"
    )
  },
  chip: badgeAndChipExample(true),
  input: {
    render: <NInput label="Email" type="email" placeholder="you@example.com" />,
    source: componentSource('NInput', '<NInput label="Email" type="email" placeholder="you@example.com" />')
  },
  progress: {
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
    render: (
      <>
        <NSwitch label="Airplane Mode" defaultValue={false} />
        <NSwitch label="Wi-Fi" defaultValue />
        <NSwitch label="Bluetooth (disabled)" disabled />
      </>
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
