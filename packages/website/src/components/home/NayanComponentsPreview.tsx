'use client';

import { type ReactNode, useState } from 'react';
import { ArrowUpRight, Braces, Code2 } from '@/design/Icons';
import Link from 'next/link';
import { ComponentsRoot, NButton, NInput, NLoading, NPress, NText, NView } from 'nayan-ui/components';
import { stylesheet } from '@/app/nayan-ui-styles';
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

const action = 'engine-preview-action';
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
          <NInput value={name} onChangeText={setName} accessibilityLabel="Display name" placeholder="Your name" className="engine-preview-input" />
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
    <NView tag="section" aria-label="Engine component preview" className="workbench-frame">
      <NView tag="header" className="workbench-title">
        <NText tag="span" className="flex min-w-0 items-center gap-2.5">
          <Braces aria-hidden size={17} className="shrink-0 text-accent" />
          <NText tag="span" className="truncate font-mono text-xs font-semibold sm:text-sm">nayan-ui</NText>
        </NText>
        <NText tag="span" className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted">
          <NText tag="span" aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
          Live preview
        </NText>
      </NView>
      <NView tag="div" role="group" aria-label="Component examples" className="workbench-tabs">
        {TABS.map((item) => (
          <NPress key={item} aria-pressed={tab === item} onPress={() => setTab(item)} className="workbench-tab">
            {item}
          </NPress>
        ))}
      </NView>
      <NView tag="div" className="workbench-stage" data-engine-preview={status}>
        {status !== 'ready' && preview}
        {status !== 'fallback' && (
          <NView tag="div"
            className={`engine-preview-surface absolute inset-0 ${status === 'ready' ? '' : 'invisible'}`}
            inert={status !== 'ready'}
            onWheelCapture={(event) => event.stopPropagation()}
          >
            <ComponentsRoot
              background="transparent"
              stylesheet={stylesheet}
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
      <NView tag="div" className="workbench-source">
        <Code2 aria-hidden size={16} className="shrink-0 text-accent" />
        <NText tag="code" className="min-w-0 overflow-x-auto whitespace-nowrap">{snippets[tab]}</NText>
        <Link href={references[tab]} className="workbench-doc-link">
          Docs <ArrowUpRight aria-hidden size={13} />
        </Link>
      </NView>
    </NView>
  );
}
