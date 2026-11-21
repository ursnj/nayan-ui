import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ComponentsRoot, NButton, NCard, NCheck, NInput, NProgress, NSlider, NText, NTheme } from '@nayan-ui/engine/components';

function Example() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('Ada');
  const [checked, setChecked] = useState(false);
  return (
    <ComponentsRoot
      style={{ width: '100%', maxWidth: 400, height: 600, flex: 'none' }}
      onError={(error) => {
        document.body.dataset.error = error.message;
      }}>
      <NTheme theme="system" colors={{ accent: '#7c3aed' }} themes={{ dark: { 'accent': '#a78bfa', 'accent-foreground': '#18181b' } }}>
        <NCard className="border-border bg-surface m-4 rounded-xl border p-4">
          <NText className="text-foreground text-xl">Rust and wgpu UI</NText>
          <NButton
            className="bg-accent text-accent-foreground w-full rounded-xl px-4 py-3 hover:bg-blue-600"
            onPress={() => setCount((value) => value + 1)}>
            Add
          </NButton>
          <NText>{`Count: ${count}`}</NText>
          <NInput label="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <NText className="text-muted text-sm">{`Hello ${name}`}</NText>
          <NCheck label="Notifications" checked={checked} onChange={setChecked} />
          <NSlider label="Volume" defaultValue={30} />
          <NProgress label="Progress" showLabel value={60} />
        </NCard>
      </NTheme>
    </ComponentsRoot>
  );
}
createRoot(document.getElementById('root')!).render(<Example />);
