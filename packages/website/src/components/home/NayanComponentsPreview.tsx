'use client';

import { type ReactNode, useState } from 'react';
import { ArrowUpRight, Braces, Code2 } from '@/design/Icons';
import Link from 'next/link';
import { ComponentsRoot, NButton, NInput, NLoading, NPress, NText, NView } from 'nayan-ui/components';
import { BUTTON_SMALL } from '@/design/system';

const TABS = ['Buttons', 'Forms', 'Feedback', 'Elements'] as const;
type Tab = (typeof TABS)[number];

const snippets: Record<Tab, string> = {
  Buttons: '<NButton onPress={increment}>Primary</NButton>',
  Forms: '<NInput value={name} onChangeText={setName} />',
  Feedback: '<NLoading size={20} />',
  Elements: '<NText>Stable</NText>'
};

const references: Record<Tab, string> = {
  Buttons: '/components/button',
  Forms: '/components/input',
  Feedback: '/components/loading',
  Elements: '/components/text'
};

const action = 'engine-preview-action min-h-9 [padding:0_16px] [border:1px_solid_transparent] rounded-lg bg-accent text-accent-foreground [font-size:14px] font-medium text-center whitespace-nowrap hover:[background-color:color-mix(in_srgb,_var(--accent)_86%,_var(--surface))] disabled:opacity-50 focus-visible:[outline:2px_solid_var(--accent)] focus-visible:[outline-offset:2px]';
const row = 'flex flex-row flex-wrap items-center gap-3';

export default function NayanComponentsPreview() {
  const [tab, setTab] = useState<Tab>('Buttons');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  let content: ReactNode;
  switch (tab) {
    case 'Buttons':
      content = (
        <>
          <NText tag="p" className="text-sm text-muted">
            Press the button to update the count.
          </NText>
          <NView tag="div" className={row}>
            <NButton type="button" onPress={() => setClicks((count) => count + 1)} className={action}>
              Primary
            </NButton>
            <NButton type="button" onPress={() => setClicks(0)} className={BUTTON_SMALL}>
              Reset
            </NButton>
          </NView>
          <NText tag="p" aria-live="polite" className="font-mono text-xs font-semibold text-accent">
            {clicks === 1 ? '1 press' : `${clicks} presses`}
          </NText>
        </>
      );
      break;
    case 'Forms':
      content = (
        <>
          <NText tag="p" className="text-sm font-semibold">
            Display name
          </NText>
          <NInput value={name} onChangeText={setName} accessibilityLabel="Display name" placeholder="Your name" className="engine-preview-input w-full h-11 min-h-11 [padding:0_12px] [border:1px_solid_var(--border)] rounded-lg bg-field-background text-foreground [font-size:14px] focus-visible:[outline:2px_solid_var(--accent)]" />
          <NText tag="p" className="text-sm text-muted">
            {name.trim() ? `Hello, ${name.trim()}` : 'Type a name to preview it here.'}
          </NText>
        </>
      );
      break;
    case 'Feedback':
      content = (
        <>
          <NView tag="div" className={row}>
            {loading && <NLoading size={20} />}
            <NText tag="p" className="text-sm">
              {loading ? 'Loading preview' : 'Preview complete'}
            </NText>
          </NView>
          <NView tag="div" className={row}>
            <NButton type="button" onPress={() => setLoading((pending) => !pending)} className={action}>
              {loading ? 'Complete' : 'Restart'}
            </NButton>
          </NView>
        </>
      );
      break;
    case 'Elements':
      content = (
        <>
          <NText tag="p" className="text-sm font-semibold">
            Status labels
          </NText>
          <NView tag="div" className={row}>
            <NText className="rounded-lg bg-success/15 px-3 py-2 text-sm">Stable</NText>
            <NText className="rounded-lg bg-warning/15 px-3 py-2 text-sm">Beta</NText>
            <NText className="rounded-lg bg-accent/15 px-3 py-2 text-sm">New</NText>
          </NView>
        </>
      );
      break;
  }
  const preview = (
    <NView tag="div" className="flex flex-col gap-4 p-5 text-foreground">
      {content}
    </NView>
  );

  return (
    <NView tag="section" aria-label="Engine component preview" className="workbench-frame overflow-hidden [border:1px_solid_color-mix(in_srgb,_var(--foreground)_14%,_var(--surface))] min-w-0 [border-radius:1.35rem] [background:var(--surface)] text-foreground [box-shadow:0_15px_44px_color-mix(in_srgb,_var(--accent)_14%,_transparent)]">
      <NView tag="header" className="workbench-title flex items-center justify-between [gap:0.6rem] [padding:0.85rem_clamp(0.7rem,_2vw,_1rem)] [border-bottom:1px_solid_var(--border)]">
        <NText tag="span" className="flex min-w-0 items-center gap-2.5">
          <Braces aria-hidden size={17} className="shrink-0 text-accent" />
          <NText tag="span" className="truncate font-mono text-xs font-semibold sm:text-sm">nayan-ui</NText>
        </NText>
        <NText tag="span" className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted">
          <NText tag="span" aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
          Live preview
        </NText>
      </NView>
      <NView tag="div" role="group" aria-label="Component examples" className="workbench-tabs grid grid-cols-4 [gap:0.15rem] [padding:0.35rem] [margin:0.7rem_0.7rem_0] [border-radius:0.55rem] [background:var(--surface-secondary)] sm:[margin:0.85rem_1rem_0]">
        {TABS.map((item) => (
          <NPress key={item} aria-pressed={tab === item} onPress={() => setTab(item)} className="workbench-tab items-center justify-center [padding:0.45rem_0] [min-height:2.15rem] [border:1px_solid_transparent] [border-radius:0.35rem] [font-size:0.75rem] font-semibold text-muted [transition:color_150ms,_background-color_150ms] hover:text-accent [&[aria-pressed=true]]:text-accent [&[aria-pressed=true]]:[border-color:var(--border)] [&[aria-pressed=true]]:[background:var(--surface)] [&[aria-pressed=true]]:[box-shadow:0_1px_2px_rgb(16_20_44_/_0.08)]">
            {item}
          </NPress>
        ))}
      </NView>
      <NView tag="div" className="workbench-stage relative overflow-hidden [height:11rem] [margin:0.7rem] [border:1px_solid_var(--border)] [border-radius:0.65rem] [background:radial-gradient(circle,_var(--site-grid-line)_1px,_transparent_1px)_center_/_15px_15px,_var(--background)] sm:[height:12rem] sm:[margin:0.85rem_1rem]" data-engine-preview={status}>
        {status !== 'ready' && preview}
        {status !== 'fallback' && (
          <NView tag="div"
            className={`engine-preview-surface [&_canvas]:[touch-action:pan-y]! absolute inset-0 ${status === 'ready' ? '' : 'invisible'}`}
            inert={status !== 'ready'}
            onWheelCapture={(event) => event.stopPropagation()}
          >
            <ComponentsRoot
              background="transparent"
              style={{ height: '100%', width: '100%', minHeight: 0 }}
              onReady={() => setStatus('ready')}
              onError={(error) => {
                if (process.env.NODE_ENV === 'development') console.warn('Engine preview:', error);
                setStatus('fallback');
              }}
            >
              {preview}
            </ComponentsRoot>
          </NView>
        )}
      </NView>
      <NView tag="div" className="workbench-source flex items-center justify-between [gap:0.6rem] [padding:0.85rem_clamp(0.7rem,_2vw,_1rem)] [justify-content:flex-start] [border-top:1px_solid_var(--border)] [background:var(--surface-secondary)] text-foreground [font-size:0.73rem]">
        <Code2 aria-hidden size={16} className="shrink-0 text-accent" />
        <NText tag="code" className="min-w-0 overflow-x-auto whitespace-nowrap">{snippets[tab]}</NText>
        <Link href={references[tab]} className="workbench-doc-link flex items-center [gap:0.2rem] shrink-0 ml-auto text-accent [font-size:0.75rem] [font-weight:650] hover:[text-decoration:underline]">
          Docs <ArrowUpRight aria-hidden size={13} />
        </Link>
      </NView>
    </NView>
  );
}
