import { createElement, type ComponentType, type ReactNode } from 'react';
import * as Engine from 'nayan-ui/components';
import { componentSource } from '@/services/nayan-ui/component-examples';
import type { NamedComponentPreview } from './types';

type Control = keyof typeof Engine;
type Props = Record<string, unknown>;

interface Node {
  control: Control;
  props: Props;
  children?: string | Node[];
}

export function element(control: Control, props: Props = {}, children?: Node['children']): Node {
  return { control, props, children };
}

function renderNode({ control, props, children }: Node): ReactNode {
  const Component = Engine[control] as ComponentType<Props>;
  return Array.isArray(children) ? createElement(Component, props, ...children.map(renderNode)) : createElement(Component, props, children);
}

function formatNode({ control, props, children }: Node, names: Set<string>, indent: string): string {
  names.add(control);
  const attributes = Object.entries(props)
    .filter(([key]) => key !== 'key')
    .map(([key, value]) => ` ${key}={${JSON.stringify(value)}}`)
    .join('');
  if (Array.isArray(children)) {
    const content = children.map((child) => formatNode(child, names, indent + '  ')).join(`\n${indent}  `);
    return `<${control}${attributes}>\n${indent}  ${content}\n${indent}</${control}>`;
  }
  return children === undefined ? `<${control}${attributes} />` : `<${control}${attributes}>{${JSON.stringify(children)}}</${control}>`;
}

export function sample(title: string, node: Node, height?: number): NamedComponentPreview {
  const names = new Set<string>();
  const source = formatNode(node, names, '          ');
  return { title, source: componentSource([...names].join(', '), source), render: renderNode(node), height };
}

const row = { className: 'w-full flex-row flex-wrap items-center gap-3' };
const panel = { className: 'w-full gap-3 rounded-xl border border-border bg-surface p-4' };
const label = { className: 'text-sm font-semibold' };
const muted = { className: 'text-sm text-muted' };
const directions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived', disabled: true }
];

export const controlScenarios = {
  'action-item': {
    title: 'Disabled action',
    source: componentSource(
      'NActionItem, NIcon',
      `<NActionItem
            name="Export report"
            description="Available when the report is ready."
            icon={<NIcon name="download" size={20} className="text-muted" />}
            className="w-full bg-surface"
            disabled
          />`
    ),
    render: (
      <Engine.NActionItem
        name="Export report"
        description="Available when the report is ready."
        icon={<Engine.NIcon name="download" size={20} className="text-muted" />}
        className="w-full bg-surface"
        disabled
      />
    )
  },
  avatar: sample(
    'Initials placeholder',
    element('NView', { className: 'h-14 w-14 items-center justify-center rounded-full bg-accent/15', accessibilityLabel: 'Avery Chen' }, [
      element('NText', { className: 'text-lg font-semibold text-accent' }, 'AC')
    ])
  ),
  badge: sample(
    'Release status',
    element('NView', panel, [
      element('NText', label, 'Version 2.4'),
      element('NBadge', { color: 'success', className: 'rounded-md bg-success/20 px-2 py-1 text-sm' }, 'Published')
    ])
  ),
  'button-group': sample('Disabled option', element('NButtonGroup', { items: directions, defaultValue: 'draft' })),
  card: sample(
    'Project summary',
    element('NCard', panel, [
      element('NText', { className: 'text-lg font-semibold' }, 'Design system'),
      element('NText', muted, '12 components updated this week.'),
      element('NBadge', { className: 'rounded-md bg-accent/15 px-2 py-1 text-sm text-accent' }, 'In progress')
    ])
  ),
  checkbox: sample(
    'Required consent',
    element('NView', panel, [element('NCheck', { label: 'Accept the terms', required: true }), element('NText', muted, 'Required to continue.')])
  ),
  chip: sample(
    'Category labels',
    element('NView', row, [
      element('NChip', { color: 'accent', className: 'rounded-full bg-accent/15 px-3 py-1 text-sm text-accent' }, 'Design'),
      element('NChip', { color: 'success', className: 'rounded-full bg-success/20 px-3 py-1 text-sm' }, 'Shipped'),
      element('NChip', { color: 'warning', className: 'rounded-full bg-warning/20 px-3 py-1 text-sm' }, 'Review')
    ])
  ),
  code: sample(
    'Inline command in a note',
    element('NView', panel, [
      element('NText', label, 'Start the development server'),
      element('NCode', { code: 'bun run dev', className: 'rounded-md bg-default px-2 py-1 text-sm' })
    ])
  ),
  disclosure: sample(
    'Open by default',
    element('NDisclosure', { className: 'w-full rounded-xl border border-border bg-surface px-3', title: 'Release details', defaultExpanded: true }, [
      element('NText', muted, 'Includes keyboard navigation improvements.')
    ])
  ),
  divider: sample(
    'Grouped settings',
    element('NView', panel, [
      element('NText', label, 'Account'),
      element('NText', muted, 'Profile and security'),
      element('NDivider'),
      element('NText', label, 'Preferences'),
      element('NText', muted, 'Appearance and notifications')
    ]),
    232
  ),
  'empty-state': sample('Offline state', element('NEmptyState', { title: 'You’re offline', description: 'Reconnect to load the latest changes.' })),
  icon: sample(
    'Icon with a text label',
    element('NView', row, [
      element('NIcon', { name: 'circle-check', size: 24, className: 'text-accent' }),
      element('NText', label, 'Verified')
    ])
  ),
  image: sample(
    'Missing image fallback',
    element('NImage', {
      src: '/nayan-ui/missing-demo.webp',
      fallbackSource: '/logo.webp',
      alt: 'Nayan UI fallback',
      width: 112,
      height: 84,
      className: 'rounded-lg border border-border'
    } satisfies Engine.NImageProps)
  ),
  'input-otp': sample('Four-digit PIN', element('NInputOtp', { label: 'Device PIN', placeholder: '0000', maxLength: 4, keyboardType: 'number-pad' })),
  kbd: sample(
    'Key combination',
    element('NView', row, [
      element('NKbd', {}, 'Ctrl'),
      element('NText', muted, '+'),
      element('NKbd', {}, 'Enter'),
      element('NText', muted, 'Run the example')
    ])
  ),
  link: sample('In-page link', element('NLink', { href: '#usage', className: 'text-accent' }, 'Jump to the editor')),
  linkify: sample('Email and web addresses', element('NLinkify', { text: 'Support: help@example.com · Docs: https://www.nayanui.com/components' })),
  loading: sample(
    'Loading inside a card',
    element('NCard', panel, [
      element('NText', label, 'Order history'),
      element('NLoading', { size: 'small', label: 'Fetching orders…', color: 'accent' })
    ]),
    198
  ),
  'menu-item': sample(
    'Unavailable menu action',
    element('NView', panel, [element('NText', muted, 'File actions'), element('NMenuItem', { disabled: true }, 'Move to archive')])
  ),
  'number-field': sample('Decimal step size', element('NNumberField', { label: 'Tax rate (%)', defaultValue: 7.5, min: 0, max: 25, step: 0.5 })),
  pattern: sample(
    'Grid and diamonds',
    element('NPattern', {
      style: { width: 226, height: 112 },
      recipe: {
        grid: { spacing: 16, lineWidth: 1, color: '#d8c8f3' },
        shapes: [
          { kind: 'diamond', cx: '35%', cy: '50%', size: 42, color: '#8b5cf6' },
          { kind: 'diamond', cx: '65%', cy: '50%', size: 42, color: '#1fb59c' }
        ]
      }
    })
  ),
  radio: sample('Preselected radio', element('NRadio', { items: [{ label: 'Email receipt', value: 'email' }], defaultValue: 'email' })),
  'radio-group': sample(
    'Delivery options',
    element('NRadioGroup', {
      label: 'Delivery speed',
      items: [
        { label: 'Standard', value: 'standard' },
        { label: 'Express', value: 'express' },
        { label: 'Same day', value: 'today', disabled: true }
      ],
      defaultValue: 'standard',
      className: 'rounded-xl bg-surface p-3'
    }),
    242
  ),
  required: sample(
    'Required and optional fields',
    element('NView', { className: 'w-full gap-2' }, [
      element('NView', row, [element('NText', label, 'Company'), element('NRequired', { isRequired: true, className: 'text-danger' })]),
      element('NInput', { accessibilityLabel: 'Company', required: true, placeholder: 'Company name' }),
      element('NInput', { label: 'Team (optional)', placeholder: 'Team name' })
    ]),
    252
  ),
  select: sample(
    'Select several tags',
    element('NSelect', {
      label: 'Tags',
      isMulti: true,
      isClearable: true,
      defaultValue: ['design'],
      options: [
        { label: 'Design', value: 'design' },
        { label: 'Engineering', value: 'engineering' },
        { label: 'QA', value: 'qa' }
      ]
    }),
    292
  ),
  skeleton: sample(
    'Profile loading',
    element('NView', { className: 'flex-row items-center gap-3 rounded-xl border border-border bg-surface p-3' }, [
      element('NSkeleton', { className: 'h-12 w-12 rounded-full' }),
      element('NView', { className: 'gap-2' }, [
        element('NSkeleton', { className: 'h-4 w-32 rounded-md' }),
        element('NSkeleton', { className: 'h-3 w-20 rounded-md' })
      ])
    ])
  ),
  'skeleton-group': sample(
    'Article placeholders',
    element('NSkeletonGroup', { className: 'gap-3', height: 80 }, [
      element('NSkeleton', { className: 'h-5 w-36 rounded' }),
      element('NSkeleton', { className: 'h-4 w-full rounded' }),
      element('NSkeleton', { className: 'h-4 w-3/4 rounded' })
    ])
  ),
  slider: sample('Stepped brightness', element('NSlider', { label: 'Brightness', min: 0, max: 100, step: 10, defaultValue: 60, showOutput: true })),
  text: sample(
    'Typography hierarchy',
    element('NView', panel, [
      element('NText', { className: 'text-xs font-semibold text-accent' }, 'RELEASE NOTES'),
      element('NText', { className: 'text-xl font-semibold' }, 'What’s new'),
      element('NText', muted, 'A short description paired with a heading and a label.')
    ]),
    205
  ),
  textarea: sample(
    'Character limit',
    element('NTextarea', {
      label: 'Short feedback',
      helperText: 'Up to 120 characters.',
      maxLength: 120,
      placeholder: 'What could we improve?',
      rows: 3
    }),
    235
  ),
  'toggle-button': sample(
    'Toggle on by default',
    element('NToggleButton', { defaultValue: true, className: 'rounded-lg bg-accent/15 px-4 py-2' }, 'Show grid')
  ),
  tooltip: sample(
    'Explain a disabled action',
    element('NTooltip', { message: 'Add a title before publishing.' }, [
      element('NView', { className: 'self-start' }, [element('NButton', { disabled: true, className: 'w-28' }, 'Publish')])
    ])
  ),
  view: sample(
    'Horizontal layout',
    element('NView', { ...panel, className: 'w-full flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4' }, [
      element('NView', { className: 'h-12 w-12 rounded-lg bg-accent/20' }),
      element('NView', { className: 'gap-1' }, [element('NText', label, 'Workspace'), element('NText', muted, 'Content beside an icon')])
    ])
  )
};
