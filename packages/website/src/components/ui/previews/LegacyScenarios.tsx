import { useState, type ReactNode } from 'react';
import * as E from '@nayan-ui/engine/components';
import { element as e, sample } from './ControlScenarios';
import { scenario } from './scenario';
import type { NamedComponentPreview } from './types';

const row = { className: 'w-full flex-row flex-wrap items-center gap-3' };
const panel = { className: 'w-full gap-3 rounded-xl border border-border bg-surface p-4' };

function browser(
  title: string,
  imports: string,
  state: string,
  body: string,
  render: ReactNode,
  height: number | 'auto' = 176
): NamedComponentPreview {
  return {
    title,
    host: true,
    height,
    render,
    source: `'use client';\n\nimport { ${imports} } from '@nayan-ui/engine/components';${state ? "\nimport { useState } from 'react';" : ''}

export default function Example() {
  ${state ? `${state}\n  ` : ''}return (
    ${body}
  );
}`
  };
}

function Field({ time }: { time: boolean }) {
  const id = time ? 'opening-time' : 'deadline-date';
  return (
    <div className="component-host-demo">
      <E.NText tag="label" htmlFor={id}>
        {time ? 'Opening time' : 'Deadline'}
      </E.NText>
      <E.NInput
        className="component-host-input"
        id={id}
        type={time ? 'time' : 'date'}
        min={time ? '08:00' : '2026-01-01'}
        max={time ? '18:00' : '2026-01-31'}
        defaultValue={time ? '09:00' : '2026-01-15'}
        step={time ? 900 : 1}
      />
    </div>
  );
}

function fieldScenario(time: boolean) {
  return browser(
    time ? '15-minute time slots' : 'Limit dates to one month',
    'NView, NText, NInput',
    '',
    `<NView>
      <NText tag="label" htmlFor="example-field">${time ? 'Opening time' : 'Deadline'}</NText>
      <NInput id="example-field" type="${time ? 'time' : 'date'}" min="${time ? '08:00' : '2026-01-01'}" max="${time ? '18:00' : '2026-01-31'}"
        defaultValue="${time ? '09:00' : '2026-01-15'}" step={${time ? 900 : 1}} />
    </NView>`,
    <Field time={time} />
  );
}

function Range() {
  const [start, setStart] = useState(new Date(2026, 0, 12));
  const [end, setEnd] = useState(new Date(2026, 0, 16));
  return (
    <>
      <E.NDatePicker label="Start date" value={start} maximumDate={end} onChange={setStart} />
      <E.NDatePicker label="End date" value={end} minimumDate={start} onChange={setEnd} />
    </>
  );
}

function Circle() {
  const [value, setValue] = useState(25);
  return (
    <div className="component-host-demo">
      <E.NView
        className="component-progress-circle"
        style={{
          background: `radial-gradient(circle, var(--background) 60%, transparent 62%), conic-gradient(var(--accent) ${value}%, var(--default) 0)`
        }}
        role="progressbar"
        accessibilityLabel="Upload progress"
        {...{ 'aria-valuenow': value }}
      >
        <E.NText>{value}%</E.NText>
      </E.NView>
      <E.NButton className="component-host-button" onPress={() => setValue(value === 100 ? 0 : value + 25)}>
        Advance upload
      </E.NButton>
    </div>
  );
}

function Popup({ menu }: { menu: boolean }) {
  return (
    <div className="component-host-demo">
      <E.NView tag="details" className="component-disclosure-list">
        <E.NText tag="summary" className="component-disclosure-trigger">
          {menu ? 'More actions' : 'About this setting'}
        </E.NText>
        {menu ? (
          <E.NView className="component-host-demo">
            <E.NMenuItem tag="button" disabled>
              Export (unavailable)
            </E.NMenuItem>
          </E.NView>
        ) : (
          <E.NText tag="p" className="component-disclosure-body">
            Display names are visible to teammates.
          </E.NText>
        )}
      </E.NView>
    </div>
  );
}

function popupScenario(menu: boolean) {
  return browser(
    menu ? 'Disabled action inside a menu' : 'Inline help popover',
    `NView, NText${menu ? ', NMenuItem' : ''}`,
    '',
    `<NView tag="details">
      <NText tag="summary">${menu ? 'More actions' : 'About this setting'}</NText>
      ${menu ? '<NMenuItem tag="button" disabled>Export (unavailable)</NMenuItem>' : '<NText tag="p">Display names are visible to teammates.</NText>'}
    </NView>`,
    <Popup menu={menu} />,
    'auto'
  );
}

const scores = [
  ['Lina', 84],
  ['Avery', 72],
  ['Sam', 95]
] as const;
function ScoreTable() {
  const [ascending, setAscending] = useState(false);
  const ordered = [...scores].sort((a, b) => (ascending ? a[1] - b[1] : b[1] - a[1]));
  return (
    <div className="component-host-demo">
      <E.NButton className="component-host-button" onPress={() => setAscending(!ascending)}>
        {ascending ? 'Lowest first' : 'Highest first'}
      </E.NButton>
      <E.NView tag="table" className="component-table" accessibilityLabel="Leaderboard">
        <E.NView tag="thead">
          <E.NView tag="tr">
            <E.NText tag="th">Player</E.NText>
            <E.NText tag="th">Score</E.NText>
          </E.NView>
        </E.NView>
        <E.NView tag="tbody">
          {ordered.map(([name, score]) => (
            <E.NView tag="tr" key={name}>
              <E.NText tag="td">{name}</E.NText>
              <E.NText tag="td">{score}</E.NText>
            </E.NView>
          ))}
        </E.NView>
      </E.NView>
    </div>
  );
}

function LoadMore() {
  const [count, setCount] = useState(12);
  return (
    <>
      <E.NList
        data={Array.from({ length: count }, (_, index) => index + 1)}
        height={136}
        itemSize={38}
        keyExtractor={String}
        onEndReached={() => setCount((previous) => Math.min(previous + 4, 24))}
        renderItem={({ item }) => <E.NText className="px-3 py-2">Result {item}</E.NText>}
      />
      <E.NText>{count === 24 ? 'All results loaded' : `${count} results loaded`}</E.NText>
    </>
  );
}

function NumberedPages() {
  const [page, setPage] = useState(1);
  const items = [
    ['Draft a note', 'Review a design'],
    ['Ship the update', 'Archive the ticket']
  ][page - 1]!;
  return (
    <>
      {items.map((item) => (
        <E.NText key={item}>{item}</E.NText>
      ))}
      <E.NView className="flex-row gap-2">
        <E.NButton isOutline disabled={page === 1} onPress={() => setPage(1)}>
          Previous
        </E.NButton>
        <E.NButton isOutline disabled={page === 2} onPress={() => setPage(2)}>
          Next
        </E.NButton>
      </E.NView>
    </>
  );
}

export const legacyScenarios = {
  menu: popupScenario(true),
  'avatar-group': sample(
    'Team with a count badge',
    e('NView', row, [
      ...['AC', 'RP', 'SJ'].map((initials) =>
        e('NView', { className: 'h-10 w-10 justify-center items-center rounded-full bg-accent/15' }, [
          e('NText', { className: 'text-sm font-semibold text-accent' }, initials)
        ])
      ),
      e('NBadge', { className: 'rounded-full bg-default px-2 py-1 text-sm' }, '+4')
    ])
  ),
  breadcrumbs: sample(
    'Longer location trail',
    e('NView', row, [
      e('NLink', { href: '/' }, 'Home'),
      e('NText', {}, '›'),
      e('NLink', { href: '/game-engine' }, 'Game Engine'),
      e('NText', {}, '›'),
      e('NText', { className: 'font-semibold' }, 'Examples')
    ])
  ),
  calendar: scenario(
    'Minimum selectable date',
    'NDatePicker',
    '<NDatePicker label="Start of term" defaultValue={new Date(2026, 8, 1)} minimumDate={new Date(2026, 8, 1)} />',
    <E.NDatePicker label="Start of term" defaultValue={new Date(2026, 8, 1)} minimumDate={new Date(2026, 8, 1)} />,
    undefined,
    374
  ),
  'checkbox-group': sample(
    'Delivery preferences',
    e('NView', panel, [
      e('NText', { className: 'font-semibold' }, 'Send updates by'),
      e('NCheck', { label: 'Email', defaultValue: true }),
      e('NCheck', { label: 'Text message', disabled: true })
    ]),
    225
  ),
  'date-field': fieldScenario(false),
  'date-range-picker': scenario(
    'Keep start and end in order',
    'NDatePicker',
    `<NDatePicker label="Start date" value={start} maximumDate={end} onChange={setStart} />
          <NDatePicker label="End date" value={end} minimumDate={start} onChange={setEnd} />`,
    <Range />,
    'const [start, setStart] = useState(new Date(2026, 0, 12));\n  const [end, setEnd] = useState(new Date(2026, 0, 16));',
    430
  ),
  'infinite-scroll': scenario(
    'Stop after the last batch',
    'NList, NText',
    `<NList data={Array.from({ length: count }, (_, index) => index + 1)} height={136} itemSize={38}
            keyExtractor={String} onEndReached={() => setCount((previous) => Math.min(previous + 4, 24))}
            renderItem={({ item }) => <NText className="px-3 py-2">Result {item}</NText>} />
          <NText>{count === 24 ? 'All results loaded' : count + ' results loaded'}</NText>`,
    <LoadMore />,
    'const [count, setCount] = useState(12);',
    220
  ),
  'list-box': sample('Single-choice list', e('NRadioGroup', { label: 'Report format', items: ['CSV', 'PDF', 'JSON'], defaultValue: 'PDF' }), 230),
  meter: sample(
    'Compare quotas',
    e('NView', { className: 'w-full gap-4' }, [
      e('NProgress', { label: 'Storage', value: 82, color: 'warning', showLabel: true }),
      e('NProgress', { label: 'Requests', value: 43, color: 'success', showLabel: true })
    ]),
    193
  ),
  pagination: scenario(
    'Change the visible rows',
    'NText, NButton',
    `{items.map((item) => <NText key={item}>{item}</NText>)}
          <NView className="flex-row gap-2">
            <NButton isOutline disabled={page === 1} onPress={() => setPage(1)}>Previous</NButton>
            <NButton isOutline disabled={page === 2} onPress={() => setPage(2)}>Next</NButton>
          </NView>`,
    <NumberedPages />,
    "const [page, setPage] = useState(1);\n  const items = page === 1 ? ['Draft a note', 'Review a design'] : ['Ship the update', 'Archive the ticket'];",
    178
  ),
  popover: popupScenario(false),
  'progress-circle': browser(
    'Advance circular progress',
    'NView, NText, NButton',
    'const [value, setValue] = useState(25);',
    `<NView>
      <NView role="progressbar" accessibilityLabel="Upload progress" {...{ 'aria-valuenow': value }}
        style={{ width: 80, height: 80, borderRadius: '50%', display: 'grid', placeItems: 'center',
          background: 'radial-gradient(circle, white 60%, transparent 62%), conic-gradient(#7c3aed ' + value + '%, #ddd 0)', color: '#211634' }}>
        <NText>{value}%</NText>
      </NView>
      <NButton onPress={() => setValue(value === 100 ? 0 : value + 25)}>Advance upload</NButton>
    </NView>`,
    <Circle />,
    206
  ),
  'switch-group': sample(
    'Permissions with a locked option',
    e('NView', panel, [
      e('NSwitch', { label: 'Desktop alerts', defaultValue: true }),
      e('NSwitch', { label: 'Sound effects' }),
      e('NSwitch', { label: 'Security notices', disabled: true, defaultValue: true })
    ]),
    245
  ),
  table: browser(
    'Sortable leaderboard',
    'NView, NText, NButton',
    `const [ascending, setAscending] = useState(false);
  const scores = ${JSON.stringify(scores)} as const;
  const ordered = [...scores].sort((a, b) => ascending ? a[1] - b[1] : b[1] - a[1]);`,
    `<NView>
      <NButton onPress={() => setAscending(!ascending)}>{ascending ? 'Lowest first' : 'Highest first'}</NButton>
      <NView tag="table" accessibilityLabel="Leaderboard">
        <NView tag="thead"><NView tag="tr"><NText tag="th">Player</NText><NText tag="th">Score</NText></NView></NView>
        <NView tag="tbody">{ordered.map(([name, score]) => (
          <NView tag="tr" key={name}><NText tag="td">{name}</NText><NText tag="td">{score}</NText></NView>
        ))}</NView>
      </NView>
    </NView>`,
    <ScoreTable />,
    'auto'
  ),
  'tag-group': sample(
    'Read-only topic tags',
    e('NView', row, [
      e('NChip', { className: 'rounded-full bg-accent/15 px-3 py-1 text-sm' }, 'Design'),
      e('NChip', { className: 'rounded-full bg-default px-3 py-1 text-sm' }, 'Accessibility'),
      e('NChip', { className: 'rounded-full bg-default px-3 py-1 text-sm' }, 'Release notes')
    ])
  ),
  'time-field': fieldScenario(true),
  toolbar: sample(
    'A toolbar with a disabled action',
    e('NView', { ...row, accessibilityRole: 'toolbar', accessibilityLabel: 'History' }, [
      e('NButton', { isOutline: true }, 'Undo'),
      e('NButton', { isOutline: true, disabled: true }, 'Redo')
    ])
  )
};
