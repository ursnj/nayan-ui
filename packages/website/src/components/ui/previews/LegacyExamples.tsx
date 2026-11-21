'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  NButton,
  NCard,
  NCheck,
  NChip,
  NDatePicker,
  NInput,
  NLink,
  NList,
  NMenuItem,
  NPress,
  NProgress,
  NText,
  NView
} from '@nayan-ui/engine/components';
import { componentSource } from '@/services/engine/component-examples';
import SwitchRows from './SwitchRows';
import type { ComponentPreview } from './types';

const row = 'flex-row flex-wrap items-center gap-2';
const hostButton = 'component-host-button';

const avatars = [
  { name: 'Ada', initials: 'AL', backgroundColor: '#dbeafe', color: '#1e3a8a' },
  { name: 'Grace', initials: 'GH', backgroundColor: '#ede9fe', color: '#581c87' },
  { name: 'Linus', initials: 'LT', backgroundColor: '#d1fae5', color: '#065f46' },
  { name: 'Two more members', initials: '+2', backgroundColor: '#e2e8f0', color: '#1e293b' }
];

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/components' },
  { label: 'Breadcrumbs', href: '' }
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
    <div className="component-host-demo">
      <div className="component-popup-trigger" ref={root}>
        <NButton
          className={hostButton}
          {...{ 'aria-expanded': open, 'aria-controls': open ? id : undefined, ref: trigger }}
          onPress={() => setOpen(!open)}
        >
          {menu ? 'Open Menu' : 'Open Popover'}
        </NButton>
        {open && (
          <NCard id={id} className="component-popup" role="group" accessibilityLabel={menu ? 'File actions' : 'Popover'}>
            {menu ? (
              commands.map((command) => (
                <NMenuItem
                  key={command}
                  tag="button"
                  className="component-popup-item"
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
      </div>
      {selected && <NText role="status">{selected} selected</NText>}
    </div>
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
    <NView className="component-table-wrapper">
      <NView tag="table" className="component-table" accessibilityLabel="Team members">
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
          <NView key={name} accessibilityLabel={name} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor }}>
            <NText className="text-xs font-semibold" style={{ color }}>
              {initials}
            </NText>
          </NView>
        ))}
      </NView>
    ),
    source: componentSource(
      'NView, NText',
      `<NView className="${row}" accessibilityLabel="Project members">
            {avatars.map(({ name, initials, color, backgroundColor }) => (
              <NView key={name} accessibilityLabel={name} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor }}>
                <NText style={{ color }}>{initials}</NText>
              </NView>
            ))}
          </NView>`,
      `const avatars = ${JSON.stringify(avatars, null, 2)};`
    )
  },
  breadcrumbs: {
    render: (
      <NView className={row} accessibilityLabel="Breadcrumbs">
        {breadcrumbs.map(({ label, href }) =>
          href ? (
            <NView key={label} className={row}>
              <NLink href={href}>{label}</NLink>
              <NText>/</NText>
            </NView>
          ) : (
            <NText className="font-semibold" key={label}>
              {label}
            </NText>
          )
        )}
      </NView>
    ),
    source: componentSource(
      'NLink, NText',
      `<NView className="${row}" accessibilityLabel="Breadcrumbs">
            {breadcrumbs.map(({ label, href }) => href
              ? <NView key={label} className="${row}"><NLink href={href}>{label}</NLink><NText>/</NText></NView>
              : <NText key={label}>{label}</NText>
            )}
          </NView>`,
      `const breadcrumbs = ${JSON.stringify(breadcrumbs, null, 2)};`
    )
  },
  calendar: {
    height: 390,
    render: <NDatePicker label="Choose a day" defaultValue={new Date(2026, 10, 21)} />,
    source: componentSource('NDatePicker', '<NDatePicker label="Choose a day" defaultValue={new Date(2026, 10, 21)} />')
  },
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
  'date-field': {
    host: true,
    render: (
      <div className="component-host-demo">
        <NText tag="label" htmlFor="example-date">
          Date
        </NText>
        <NInput id="example-date" type="date" className="component-host-input" />
      </div>
    ),
    source: fieldSource('date', 'Date')
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
  meter: {
    render: <NProgress color="warning" label="Storage used" value={75} showLabel />,
    source: componentSource('NProgress', '<NProgress color="warning" label="Storage used" value={75} showLabel />')
  },
  pagination: {
    render: <Pagination />,
    source: componentSource(
      'NButton, NText',
      `<NText>Page {page} of 3</NText>
          <NView className="${row}">
            <NButton isOutline disabled={page === 1} onPress={() => setPage(page - 1)}>Previous</NButton>
            {[1, 2, 3].map((number) => (
              <NButton key={number} isOutline={page !== number} onPress={() => setPage(number)}>{number}</NButton>
            ))}
            <NButton isOutline disabled={page === 3} onPress={() => setPage(page + 1)}>Next</NButton>
          </NView>`,
      'const [page, setPage] = useState(1);'
    )
  },
  'progress-circle': {
    host: true,
    render: (
      <NView className="component-host-demo">
        <NView tag="div" className="component-progress-circle" role="progressbar" accessibilityLabel="Upload progress" {...{ 'aria-valuenow': 72 }}>
          <NText>72%</NText>
        </NView>
      </NView>
    ),
    source: `import { NText, NView } from '@nayan-ui/engine/components';

export default function Example() {
  const value = 72;
  return (
    <NView role="progressbar" accessibilityLabel="Upload progress" {...{ 'aria-valuenow': value }}
      style={{ width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center',
        background: \`radial-gradient(circle, white 60%, transparent 62%), conic-gradient(#0e63ee \${value}%, #e2e8f0 0)\` }}>
      <NText>{value}%</NText>
    </NView>
  );
}`
  },
  'switch-group': {
    host: true,
    height: 206,
    render: <SwitchRows options={[{ label: 'Email updates', enabled: true }, { label: 'Push notifications' }, { label: 'Weekly summary' }]} />,
    source: componentSource(
      'NSwitch, NText',
      `<NText>Notifications</NText>
          <NSwitch label="Email updates" defaultValue />
          <NSwitch label="Push notifications" />
          <NSwitch label="Weekly summary" />`
    )
  },
  table: {
    host: true,
    render: <Table />,
    source: `import { NText, NView } from '@nayan-ui/engine/components';

const columns = ${JSON.stringify(columns)};
const people = ${JSON.stringify(people, null, 2)};

export default function Example() {
  return (
    <NView tag="table" accessibilityLabel="Team members">
      <NView tag="thead">
        <NView tag="tr">{columns.map((column) => <NText tag="th" key={column}>{column}</NText>)}</NView>
      </NView>
      <NView tag="tbody">
        {people.map((person) => (
          <NView tag="tr" key={person[1]}>{person.map((cell) => <NText tag="td" key={cell}>{cell}</NText>)}</NView>
        ))}
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
          {tags.length < labels.length && <NButton isOutline onPress={() => setTags(labels)}>Restore tags</NButton>}`,
      `const labels = ${JSON.stringify(labels)};\n  const [tags, setTags] = useState(labels);`
    )
  },
  'time-field': {
    host: true,
    render: (
      <div className="component-host-demo">
        <NText tag="label" htmlFor="example-time">
          Time
        </NText>
        <NInput id="example-time" type="time" className="component-host-input" />
      </div>
    ),
    source: fieldSource('time', 'Time')
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

function fieldSource(type: 'date' | 'time', label: string) {
  return `import { NInput, NText, NView } from '@nayan-ui/engine/components';

export default function Example() {
  return (
    <NView>
      <NText tag="label" htmlFor="example-${type}">${label}</NText>
      <NInput id="example-${type}" type="${type}" />
    </NView>
  );
}`;
}

function popupSource(menu: boolean) {
  const action = menu ? 'Open Menu' : 'Open Popover';
  const content = menu
    ? `{['Cut', 'Copy', 'Paste'].map((action) => (
            <NMenuItem tag="button" key={action} onClick={() => setOpen(false)}>{action}</NMenuItem>
          ))}`
    : '<NText>This is popover content.</NText>';
  return `'use client';

import { useState } from 'react';
import { NButton, NCard, ${menu ? 'NMenuItem' : 'NText'}, NView } from '@nayan-ui/engine/components';

export default function Example() {
  const [open, setOpen] = useState(false);
  return (
    <NView style={{ position: 'relative' }}>
      <NButton onPress={() => setOpen(!open)} {...{ 'aria-expanded': open }}>${action}</NButton>
      {open && (
        <NCard style={{ position: 'absolute', top: '100%', padding: 12 }}>
          ${content}
        </NCard>
      )}
    </NView>
  );
}`;
}

export const legacyComponentAlternatives = {
  menu: 'menu-item',
  'avatar-group': 'view',
  breadcrumbs: 'link',
  calendar: 'date-picker',
  'checkbox-group': 'checkbox',
  'date-field': 'input',
  'date-range-picker': 'date-picker',
  'infinite-scroll': 'list',
  'list-box': 'checkbox',
  meter: 'progress',
  pagination: 'button',
  popover: 'card',
  'progress-circle': 'progress',
  'switch-group': 'switch',
  table: 'view',
  'tag-group': 'chip',
  'time-field': 'input',
  toolbar: 'button'
} satisfies Record<keyof typeof legacyExamples, string>;

export function legacyExample(slug: string): ComponentPreview | undefined {
  return Object.hasOwn(legacyExamples, slug) ? legacyExamples[slug as keyof typeof legacyExamples] : undefined;
}
