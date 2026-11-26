'use client';

import { PREVIEW_STACK, PREVIEW_BUTTON, PREVIEW_FIELD } from '@/design/system';
import { useEffect, useId, useRef, useState } from 'react';
import { NBadge, NButton, NCard, NCheck, NChip, NDatePicker, NInput, NLink, NList, NMenuItem, NPress, NText, NView } from 'nayan-ui/components';
import { componentSource } from '@/services/ui/component-examples';
import { avatarInitialsClass, breadcrumbOverview, element, sample } from './ControlScenarios';
import SwitchRows, { switchSource } from './SwitchRows';
import type { ComponentPreview } from './types';

const row = 'flex-row flex-wrap items-center gap-2';
const popup =
  'component-popup absolute [z-index:1] [inset:calc(100%_+_0.5rem)_auto_auto_0] [min-width:max-content] [border:1px_solid_var(--border)] [border-radius:0.65rem] [background:var(--overlay)] [box-shadow:0_6px_18px_color-mix(in_srgb,_var(--foreground)_13%,_transparent)] [padding:0.65rem]';
const popupItem =
  'component-popup-item block w-full [border-radius:0.35rem] [padding:0.25rem_0.5rem] [text-align:start] cursor-pointer hover:[background:color-mix(in_srgb,_var(--accent)_12%,_var(--surface))] focus-visible:[background:color-mix(in_srgb,_var(--accent)_12%,_var(--surface))]';

const avatars = [
  { name: 'Ada', initials: 'AL', backgroundColor: '#dbeafe', color: '#1e3a8a' },
  { name: 'Grace', initials: 'GH', backgroundColor: '#ede9fe', color: '#581c87' },
  { name: 'Linus', initials: 'LT', backgroundColor: '#d1fae5', color: '#065f46' },
  { name: 'Two more members', initials: '+2', backgroundColor: '#e2e8f0', color: '#1e293b' }
];

const people = [
  ['Alice', 'alice@example.com', 'Admin'],
  ['Bob', 'bob@example.com', 'Member'],
  ['Charlie', 'charlie@example.com', 'Viewer']
];
const columns = ['Name', 'Email', 'Role'];
const commands = ['Cut', 'Copy', 'Paste'];
const files = [
  { label: 'Quarterly report.pdf', detail: '2.4 MB · PDF' },
  { label: 'Budget.xlsx', detail: '812 KB · Spreadsheet' },
  { label: 'Archive.zip', detail: '18 MB · Archive', disabled: true }
];
const labels = ['Design', 'Development', 'Documentation'];
const subscriptions = [{ label: 'Release notes', enabled: true }, { label: 'Security alerts' }, { label: 'Weekly digest' }];
const avatarLabel = `${avatarInitialsClass} text-sm font-medium`;

function initialsBadge(initials: string, className: string, size = 40) {
  return element('NBadge', { width: size, height: size, className: `${avatarInitialsClass} font-medium ${className}` }, initials);
}

const avatarPreview = sample(
  'Overview',
  element('NView', { className: 'gap-3' }, [
    element('NText', { className: 'font-semibold' }, 'Colors'),
    element('NView', { className: row }, [
      initialsBadge('ND', 'bg-default text-sm text-foreground'),
      initialsBadge('AK', 'bg-accent/15 text-sm text-accent'),
      initialsBadge('RS', 'bg-success/20 text-sm text-foreground'),
      initialsBadge('JP', 'bg-warning/20 text-sm text-foreground'),
      initialsBadge('MM', 'bg-danger/20 text-sm text-foreground')
    ]),
    element('NText', { className: 'font-semibold' }, 'Sizes'),
    element('NView', { className: row }, [
      initialsBadge('SM', 'bg-accent/15 text-xs text-accent', 32),
      element('NImage', { src: '/logo.webp', alt: 'Nayan UI', width: 40, height: 40, className: 'rounded-full' }),
      initialsBadge('LG', 'bg-accent/15 text-base text-accent', 48)
    ])
  ])
);

const meterPreview = sample(
  'Overview',
  element('NView', { className: 'gap-3' }, [
    element('NText', { className: 'font-semibold' }, 'Colors'),
    element('NProgress', { color: 'accent', label: 'Storage', value: 30, showLabel: true }),
    element('NProgress', { color: 'success', label: 'Battery', value: 60, showLabel: true }),
    element('NProgress', { color: 'warning', label: 'Memory', value: 80, showLabel: true }),
    element('NProgress', { color: 'danger', label: 'CPU', value: 95, showLabel: true }),
    element('NText', { className: 'font-semibold' }, 'Sizes'),
    element('NProgress', { label: 'Small', size: 'sm', value: 50, showLabel: true }),
    element('NProgress', { label: 'Medium', size: 'md', value: 50, showLabel: true }),
    element('NProgress', { label: 'Large', size: 'lg', value: 50, showLabel: true })
  ])
);

function Popup({ menu }: { menu: boolean }) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');
  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <NView tag="div" className={PREVIEW_STACK}>
      <NView tag="div" className="component-popup-trigger relative" ref={root}>
        <NButton
          className={PREVIEW_BUTTON}
          {...{ 'aria-expanded': open, 'aria-controls': open ? id : undefined, ref: trigger }}
          onPress={() => setOpen(!open)}
        >
          {menu ? 'Open Menu' : 'Open Popover'}
        </NButton>
        {open && (
          <NCard id={id} className={popup} role="group" accessibilityLabel={menu ? 'File actions' : 'Popover'}>
            {menu ? (
              commands.map((command) => (
                <NMenuItem
                  key={command}
                  tag="button"
                  className={popupItem}
                  onClick={() => {
                    setSelected(command);
                    setOpen(false);
                    trigger.current?.focus();
                  }}
                >
                  {command}
                </NMenuItem>
              ))
            ) : (
              <NText>This is popover content.</NText>
            )}
          </NCard>
        )}
      </NView>
      {selected && <NText role="status">{selected} selected</NText>}
    </NView>
  );
}

function InfiniteList() {
  const [count, setCount] = useState(12);
  return (
    <NList
      data={Array.from({ length: count }, (_, index) => index + 1)}
      height={190}
      itemSize={36}
      keyExtractor={String}
      onEndReached={() => setCount((value) => Math.min(value + 12, 60))}
      renderItem={({ item }) => <NText className="p-2">Item {item}</NText>}
    />
  );
}

function Pagination() {
  const [page, setPage] = useState(1);
  return (
    <>
      <NText>Page {page} of 3</NText>
      <NView className={row}>
        <NButton isOutline disabled={page === 1} onPress={() => setPage(page - 1)}>
          Previous
        </NButton>
        {[1, 2, 3].map((number) => (
          <NButton key={number} isOutline={page !== number} accessibilityLabel={`Page ${number}`} onPress={() => setPage(number)}>
            {number}
          </NButton>
        ))}
        <NButton isOutline disabled={page === 3} onPress={() => setPage(page + 1)}>
          Next
        </NButton>
      </NView>
    </>
  );
}

function TagGroup() {
  const [tags, setTags] = useState(labels);
  return (
    <>
      <NView className={row}>
        {tags.map((label) => (
          <NPress key={label} accessibilityLabel={`Remove ${label}`} onPress={() => setTags(tags.filter((tag) => tag !== label))}>
            <NChip className="rounded-full bg-default px-3 py-2">{label} ×</NChip>
          </NPress>
        ))}
      </NView>
      {tags.length < labels.length && (
        <NButton className="self-start" isOutline onPress={() => setTags(labels)}>
          Restore tags
        </NButton>
      )}
    </>
  );
}

function Toolbar() {
  const [action, setAction] = useState('');
  return (
    <>
      <NView className={row} accessibilityRole="toolbar" accessibilityLabel="Formatting">
        {['Bold', 'Italic', 'Underline'].map((label) => (
          <NButton key={label} isOutline={action !== label} onPress={() => setAction(label)}>
            {label}
          </NButton>
        ))}
      </NView>
      <NText>{action ? `${action} selected` : 'Choose a formatting action.'}</NText>
    </>
  );
}

function Table() {
  return (
    <NView className="component-table-wrapper overflow-auto [margin:1.25rem] [border:1px_solid_var(--border)] [border-radius:0.75rem] [background:var(--surface)]">
      <NView tag="table" className="component-table w-full [border-collapse:collapse] [font-size:0.875rem] [line-height:1.4] [text-align:start] [&_:is(th,td)]:[padding:0.65rem_0.75rem] [&_:is(th,td)]:[text-align:start] [&_th]:[background:var(--surface-secondary)] [&_tr:nth-child(even)]:[background:var(--surface-secondary)]" accessibilityLabel="Team members">
        <NView tag="thead">
          <NView tag="tr">
            {columns.map((column) => (
              <NText tag="th" key={column}>
                {column}
              </NText>
            ))}
          </NView>
        </NView>
        <NView tag="tbody">
          {people.map((person) => (
            <NView tag="tr" key={person[1]}>
              {person.map((cell) => (
                <NText tag="td" key={cell}>
                  {cell}
                </NText>
              ))}
            </NView>
          ))}
        </NView>
      </NView>
    </NView>
  );
}

const legacyExamples = {
  avatar: avatarPreview,
  menu: {
    host: true,
    render: <Popup menu />,
    source: popupSource(true)
  },
  popover: {
    host: true,
    render: <Popup menu={false} />,
    source: popupSource(false)
  },
  'avatar-group': {
    render: (
      <NView className={row} accessibilityLabel="Project members">
        {avatars.map(({ name, initials, color, backgroundColor }) => (
          <NBadge key={name} accessibilityLabel={name} width={40} height={40} className={avatarLabel} style={{ backgroundColor, color }}>
            {initials}
          </NBadge>
        ))}
      </NView>
    ),
    source: componentSource(
      'NView, NBadge',
      `<NView className="${row}" accessibilityLabel="Project members">
            {avatars.map(({ name, initials, color, backgroundColor }) => (
              <NBadge key={name} accessibilityLabel={name} width={40} height={40} className="${avatarLabel}" style={{ backgroundColor, color }}>
                {initials}
              </NBadge>
            ))}
          </NView>`,
      `const avatars = ${JSON.stringify(avatars, null, 2)};`
    )
  },
  breadcrumbs: breadcrumbOverview,
  'checkbox-group': {
    render: (
      <>
        <NText className="font-semibold">Interests</NText>
        <NCheck label="Design" defaultValue />
        <NCheck label="Development" />
        <NCheck label="Documentation" />
      </>
    ),
    source: componentSource(
      'NCheck, NText',
      `<NText>Interests</NText>
          <NCheck label="Design" defaultValue />
          <NCheck label="Development" />
          <NCheck label="Documentation" />`
    )
  },
  'date-range-picker': {
    height: 440,
    render: (
      <>
        <NDatePicker label="Start date" />
        <NDatePicker label="End date" />
      </>
    ),
    source: componentSource('NDatePicker', '<NDatePicker label="Start date" />\n          <NDatePicker label="End date" />')
  },
  'infinite-scroll': {
    render: <InfiniteList />,
    source: componentSource(
      'NList, NText',
      `<NList data={Array.from({ length: count }, (_, index) => index + 1)}
            height={190} itemSize={36} keyExtractor={String}
            onEndReached={() => setCount((value) => Math.min(value + 12, 60))}
            renderItem={({ item }) => <NText className="p-2">Item {item}</NText>}
          />`,
      'const [count, setCount] = useState(12);'
    )
  },
  'list-box': {
    render: (
      <>
        <NText className="font-semibold">Files</NText>
        {files.map(({ label, detail, disabled }, index) => (
          <NView key={label} className="gap-1 rounded-lg border border-border bg-surface p-2">
            <NCheck label={label} disabled={disabled} defaultValue={index === 0} />
            <NText className="text-sm text-muted">{detail}</NText>
          </NView>
        ))}
      </>
    ),
    height: 290,
    source: componentSource(
      'NCheck, NText',
      `<NText>Files</NText>
          {files.map(({ label, detail, disabled }, index) => (
            <NView key={label} className="rounded-lg border border-border bg-surface p-2">
              <NCheck label={label} disabled={disabled} defaultValue={index === 0} />
              <NText className="text-sm text-muted">{detail}</NText>
            </NView>
          ))}`,
      `const files = ${JSON.stringify(files, null, 2)};`
    )
  },
  meter: meterPreview,
  pagination: {
    render: <Pagination />,
    source: componentSource(
      'NButton, NText',
      `<NText>Page {page} of 3</NText>
          <NView className="${row}">
            <NButton isOutline disabled={page === 1} onPress={() => setPage(page - 1)}>Previous</NButton>
            {[1, 2, 3].map((number) => (
              <NButton key={number} isOutline={page !== number} accessibilityLabel={\`Page \${number}\`} onPress={() => setPage(number)}>{number}</NButton>
            ))}
            <NButton isOutline disabled={page === 3} onPress={() => setPage(page + 1)}>Next</NButton>
          </NView>`,
      'const [page, setPage] = useState(1);'
    )
  },
  'progress-circle': {
    host: true,
    render: (
      <NView className={PREVIEW_STACK}>
        <NView tag="div" className="component-progress-circle grid [width:5.25rem] [height:5.25rem] [place-items:center] [border-radius:50%] [background:radial-gradient(circle,_var(--background)_60%,_transparent_62%),_conic-gradient(var(--accent)_72%,_var(--default)_0)] font-semibold" role="progressbar" accessibilityLabel="Upload progress" {...{ 'aria-valuenow': 72 }}>
          <NText>72%</NText>
        </NView>
      </NView>
    ),
    source: `import { NText, NView } from 'nayan-ui/components';

export default function Example() {
  return (
    <NView className="${PREVIEW_STACK}">
      <NView tag="div" className="component-progress-circle grid [width:5.25rem] [height:5.25rem] [place-items:center] [border-radius:50%] [background:radial-gradient(circle,_var(--background)_60%,_transparent_62%),_conic-gradient(var(--accent)_72%,_var(--default)_0)] font-semibold" role="progressbar" accessibilityLabel="Upload progress" {...{ 'aria-valuenow': 72 }}>
        <NText>72%</NText>
      </NView>
    </NView>
  );
}`
  },
  'switch-group': {
    host: true,
    render: <SwitchRows options={subscriptions} label="Email me about" />,
    source: switchSource(subscriptions, 'Email me about')
  },
  table: {
    host: true,
    render: <Table />,
    source: `import { NText, NView } from 'nayan-ui/components';

const columns = ${JSON.stringify(columns)};
const people = ${JSON.stringify(people, null, 2)};

export default function Example() {
  return (
    <NView className="component-table-wrapper overflow-auto [margin:1.25rem] [border:1px_solid_var(--border)] [border-radius:0.75rem] [background:var(--surface)]">
      <NView tag="table" className="component-table w-full [border-collapse:collapse] [font-size:0.875rem] [line-height:1.4] [text-align:start] [&_:is(th,td)]:[padding:0.65rem_0.75rem] [&_:is(th,td)]:[text-align:start] [&_th]:[background:var(--surface-secondary)] [&_tr:nth-child(even)]:[background:var(--surface-secondary)]" accessibilityLabel="Team members">
        <NView tag="thead">
          <NView tag="tr">{columns.map((column) => <NText tag="th" key={column}>{column}</NText>)}</NView>
        </NView>
        <NView tag="tbody">
          {people.map((person) => (
            <NView tag="tr" key={person[1]}>{person.map((cell) => <NText tag="td" key={cell}>{cell}</NText>)}</NView>
          ))}
        </NView>
      </NView>
    </NView>
  );
}`
  },
  'tag-group': {
    render: <TagGroup />,
    source: componentSource(
      'NButton, NChip, NPress',
      `<NView className="${row}">
            {tags.map((label) => (
              <NPress key={label} accessibilityLabel={\`Remove \${label}\`}
                onPress={() => setTags(tags.filter((tag) => tag !== label))}>
                <NChip className="rounded-full bg-default px-3 py-2">{label} ×</NChip>
              </NPress>
            ))}
          </NView>
          {tags.length < labels.length && <NButton className="self-start" isOutline onPress={() => setTags(labels)}>Restore tags</NButton>}`,
      `const labels = ${JSON.stringify(labels)};\n  const [tags, setTags] = useState(labels);`
    )
  },
  'time-field': {
    host: true,
    render: (
      <NView tag="div" className={PREVIEW_STACK}>
        <NText tag="label" htmlFor="example-time">
          Time
        </NText>
        <NInput id="example-time" type="time" className={PREVIEW_FIELD} />
      </NView>
    ),
    source: timeFieldSource()
  },
  toolbar: {
    render: <Toolbar />,
    source: componentSource(
      'NButton, NText',
      `<NView className="${row}" accessibilityRole="toolbar" accessibilityLabel="Formatting">
            {['Bold', 'Italic', 'Underline'].map((label) => (
              <NButton key={label} isOutline={action !== label} onPress={() => setAction(label)}>{label}</NButton>
            ))}
          </NView>
          <NText>{action ? \`\${action} selected\` : 'Choose a formatting action.'}</NText>`,
      "const [action, setAction] = useState('');"
    )
  }
} satisfies Record<string, ComponentPreview>;

function timeFieldSource() {
  return `import { NInput, NText, NView } from 'nayan-ui/components';

export default function Example() {
  return (
    <NView className="${PREVIEW_STACK}">
      <NText tag="label" htmlFor="example-time">Time</NText>
      <NInput id="example-time" type="time" className="${PREVIEW_FIELD}" />
    </NView>
  );
}`;
}

function popupSource(menu: boolean) {
  const action = menu ? 'Open Menu' : 'Open Popover';
  const content = menu
    ? `{${JSON.stringify(commands)}.map((action) => (
            <NMenuItem tag="button" key={action} className="${popupItem}" onClick={() => setOpen(false)}>{action}</NMenuItem>
          ))}`
    : '<NText>This is popover content.</NText>';
  return `'use client';

import { useState } from 'react';
import { NButton, NCard, ${menu ? 'NMenuItem' : 'NText'}, NView } from 'nayan-ui/components';

export default function Example() {
  const [open, setOpen] = useState(false);
  return (
    <NView className="${PREVIEW_STACK}">
      <NView className="component-popup-trigger relative">
        <NButton className="${PREVIEW_BUTTON}" onPress={() => setOpen(!open)} {...{ 'aria-expanded': open }}>${action}</NButton>
        {open && (
          <NCard className="${popup}" role="group" accessibilityLabel="${menu ? 'File actions' : 'Popover'}">
            ${content}
          </NCard>
        )}
      </NView>
    </NView>
  );
}`;
}

export function legacyExample(slug: string): ComponentPreview | undefined {
  return Object.hasOwn(legacyExamples, slug) ? legacyExamples[slug as keyof typeof legacyExamples] : undefined;
}
