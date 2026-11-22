import { PREVIEW_STACK, PREVIEW_BUTTON, PREVIEW_FIELD } from '@/design/system';
import { useState, type ReactNode } from 'react';
import * as E from 'nayan-ui/components';
import { avatarInitialsClass, element as e, sample } from './ControlScenarios';
import { scenario } from './scenario';
import type { NamedComponentPreview } from './types';

const row = { className: 'w-full flex-row flex-wrap items-center gap-3' };
const panel = { className: 'w-full gap-3 rounded-xl border border-border bg-surface p-4' };

function browser(title: string, imports: string, state: string, body: string, render: ReactNode, height?: number | 'auto'): NamedComponentPreview {
  return {
    title,
    host: true,
    height,
    render,
    source: `'use client';\n\nimport { ${imports} } from 'nayan-ui/components';${state ? "\nimport { useState } from 'react';" : ''}

export default function Example() {
  ${state ? `${state}\n  ` : ''}return (
    ${body}
  );
}`
  };
}

function TimeField() {
  return (
    <E.NView tag="div" className={PREVIEW_STACK}>
      <E.NText tag="label" htmlFor="opening-time">
        Opening time
      </E.NText>
      <E.NInput className={PREVIEW_FIELD} id="opening-time" type="time" min="08:00" max="18:00" defaultValue="09:00" step={900} />
    </E.NView>
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
    <E.NView tag="div" className={PREVIEW_STACK}>
      <E.NView
        className="component-progress-circle grid [width:5.25rem] [height:5.25rem] [place-items:center] [border-radius:50%] [background:radial-gradient(circle,_var(--background)_60%,_transparent_62%),_conic-gradient(var(--accent)_72%,_var(--default)_0)] font-semibold"
        style={{
          background: `radial-gradient(circle, var(--background) 60%, transparent 62%), conic-gradient(var(--accent) ${value}%, var(--default) 0)`
        }}
        role="progressbar"
        accessibilityLabel="Upload progress"
        {...{ 'aria-valuenow': value }}
      >
        <E.NText>{value}%</E.NText>
      </E.NView>
      <E.NButton className={PREVIEW_BUTTON} onPress={() => setValue(value === 100 ? 0 : value + 25)}>
        Advance upload
      </E.NButton>
    </E.NView>
  );
}

const disclosure = 'component-disclosure-list overflow-hidden rounded-[0.85rem] border border-border bg-surface';
const disclosureTrigger =
  'component-disclosure-trigger flex min-h-12 items-center gap-3 px-3.5 py-[0.65rem] text-sm font-semibold cursor-pointer justify-between [list-style:none] [&::-webkit-details-marker]:hidden hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2';
const disclosureBody = 'component-disclosure-body px-3.5 pb-3.5 text-sm leading-normal text-muted';

function Popup({ menu }: { menu: boolean }) {
  return (
    <E.NView tag="div" className={PREVIEW_STACK}>
      <E.NView tag="details" className={disclosure}>
        <E.NText tag="summary" className={disclosureTrigger}>
          {menu ? 'More actions' : 'About this setting'}
        </E.NText>
        {menu ? (
          <E.NView className={PREVIEW_STACK}>
            <E.NMenuItem tag="button" disabled>
              Export (unavailable)
            </E.NMenuItem>
          </E.NView>
        ) : (
          <E.NText tag="p" className={disclosureBody}>
            Display names are visible to teammates.
          </E.NText>
        )}
      </E.NView>
    </E.NView>
  );
}

function popupScenario(menu: boolean) {
  return browser(
    menu ? 'Disabled action inside a menu' : 'Inline help popover',
    `NView, NText${menu ? ', NMenuItem' : ''}`,
    '',
    `<NView className="${PREVIEW_STACK}">
      <NView tag="details" className="${disclosure}">
        <NText tag="summary" className="${disclosureTrigger}">${menu ? 'More actions' : 'About this setting'}</NText>
        ${menu ? `<NView className="${PREVIEW_STACK}"><NMenuItem tag="button" disabled>Export (unavailable)</NMenuItem></NView>` : `<NText tag="p" className="${disclosureBody}">Display names are visible to teammates.</NText>`}
      </NView>
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
const tableStyles =
  'component-table w-full [border-collapse:collapse] [font-size:0.875rem] [line-height:1.4] [text-align:start] [&_:is(th,td)]:[padding:0.65rem_0.75rem] [&_:is(th,td)]:[text-align:start] [&_th]:[background:var(--surface-secondary)] [&_tr:nth-child(even)]:[background:var(--surface-secondary)]';

function ScoreTable() {
  const [ascending, setAscending] = useState(false);
  const ordered = [...scores].sort((a, b) => (ascending ? a[1] - b[1] : b[1] - a[1]));
  return (
    <E.NView tag="div" className={PREVIEW_STACK}>
      <E.NButton className={PREVIEW_BUTTON} onPress={() => setAscending(!ascending)}>
        {ascending ? 'Lowest first' : 'Highest first'}
      </E.NButton>
      <E.NView tag="table" className={tableStyles} accessibilityLabel="Leaderboard">
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
    </E.NView>
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
        e('NBadge', { width: 40, height: 40, className: `${avatarInitialsClass} bg-accent/15 text-sm font-semibold text-accent` }, initials)
      ),
      e('NBadge', { className: 'rounded-full bg-default px-2 py-1 text-sm' }, '+4')
    ])
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
    `<NView className="${PREVIEW_STACK}">
      <NView className="component-progress-circle grid [width:5.25rem] [height:5.25rem] [place-items:center] [border-radius:50%] [background:radial-gradient(circle,_var(--background)_60%,_transparent_62%),_conic-gradient(var(--accent)_72%,_var(--default)_0)] font-semibold" role="progressbar" accessibilityLabel="Upload progress" {...{ 'aria-valuenow': value }}
        style={{ background: \`radial-gradient(circle, var(--background) 60%, transparent 62%), conic-gradient(var(--accent) \${value}%, var(--default) 0)\` }}>
        <NText>{value}%</NText>
      </NView>
      <NButton className="${PREVIEW_BUTTON}" onPress={() => setValue(value === 100 ? 0 : value + 25)}>Advance upload</NButton>
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
    `<NView className="${PREVIEW_STACK}">
      <NButton className="${PREVIEW_BUTTON}" onPress={() => setAscending(!ascending)}>{ascending ? 'Lowest first' : 'Highest first'}</NButton>
      <NView tag="table" className="${tableStyles}" accessibilityLabel="Leaderboard">
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
  'time-field': browser(
    '15-minute time slots',
    'NView, NText, NInput',
    '',
    `<NView className="${PREVIEW_STACK}">
      <NText tag="label" htmlFor="opening-time">Opening time</NText>
      <NInput className="${PREVIEW_FIELD}" id="opening-time" type="time" min="08:00" max="18:00" defaultValue="09:00" step={900} />
    </NView>`,
    <TimeField />
  ),
  toolbar: sample(
    'A toolbar with a disabled action',
    e('NView', { ...row, accessibilityRole: 'toolbar', accessibilityLabel: 'History' }, [
      e('NButton', { isOutline: true }, 'Undo'),
      e('NButton', { isOutline: true, disabled: true }, 'Redo')
    ])
  )
};
