import { useState } from 'react';
import { NButton, NInput, NPage, NText, useNSystemBars } from 'nayan-ui/components';
import type { NamedComponentPreview } from './types';

export const pageExample: NamedComponentPreview = {
  title: 'Screen surface',
  host: true,
  height: 180,
  render: <NPage className="p-4" viewportStyle={{ height: 160 }}><NText>Page content</NText></NPage>,
  source: `'use client';

import { NPage, NText, NTheme } from 'nayan-ui/components';

export default function Example() {
  return (
    <NTheme surface={false}>
      <NPage className="p-4" viewportStyle={{ height: 160 }}>
        <NText>Page content</NText>
      </NPage>
    </NTheme>
  );
}`
};

export const pageFormExample: NamedComponentPreview = {
  title: 'Keyboard-aware form',
  host: true,
  height: 220,
  render: <NPage keyboard className="p-4" viewportStyle={{ height: 200 }}><NInput label="Name" /></NPage>,
  source: `'use client';

import { NInput, NPage, NTheme } from 'nayan-ui/components';

export default function Example() {
  return (
    <NTheme surface={false}>
      <NPage keyboard className="p-4" viewportStyle={{ height: 200 }}>
        <NInput label="Name" />
      </NPage>
    </NTheme>
  );
}`
};

function SystemBarsPreview({ toggle = false }: { toggle?: boolean }) {
  const [override, setOverride] = useState(true);
  useNSystemBars(override ? { statusBarStyle: 'light' } : false);
  return (
    <>
      <NText>{override ? 'Status bar style: light' : 'Status bar style: inherited'}</NText>
      {toggle && <NButton onPress={() => setOverride((value) => !value)}>Toggle override</NButton>}
    </>
  );
}

export const systemBarsExample: NamedComponentPreview = {
  title: 'Status bar style',
  host: true,
  note: 'Run this on iOS or Android to see the system bar change. Call the hook from the screen outside the NPage rendering surface.',
  render: <SystemBarsPreview />,
  source: `'use client';

import { NPage, NText, useNSystemBars } from 'nayan-ui/components';

export default function Example() {
  useNSystemBars({ statusBarStyle: 'light' });
  return <NPage viewportStyle={{ height: 120 }}><NText>Screen content</NText></NPage>;
}`
};

export const systemBarsToggleExample: NamedComponentPreview = {
  title: 'Restore the inherited style',
  host: true,
  render: <SystemBarsPreview toggle />,
  source: `'use client';

import { useState } from 'react';
import { NButton, NPage, useNSystemBars } from 'nayan-ui/components';

export default function Example() {
  const [override, setOverride] = useState(true);
  useNSystemBars(override ? { statusBarStyle: 'light' } : false);

  return (
    <NPage className="p-4" viewportStyle={{ height: 120 }}>
      <NButton onPress={() => setOverride((value) => !value)}>Toggle override</NButton>
    </NPage>
  );
}`
};
