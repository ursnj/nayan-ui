import { useState } from 'react';
import * as E from 'nayan-ui/components';
import { controlledAccordion } from './AccordionExamples';
import { scenario } from './scenario';
import type { NamedComponentPreview } from './types';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <>
      <E.NButton leftIcon={<E.NIcon name="plus" size={16} />} onPress={() => setCount(count + 1)}>Add one</E.NButton>
      <E.NText>Count: {count}</E.NText>
    </>
  );
}

function RecoveryAlert() {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <E.NAlert title={saved ? 'Saved' : 'Upload failed'} description={saved ? 'Your file is ready.' : 'Retry the example upload.'} />
      <E.NButton onPress={() => setSaved(!saved)}>{saved ? 'Reset upload' : 'Retry upload'}</E.NButton>
    </>
  );
}

const products = ['Sketchbook', 'Pencil', 'Marker', 'Ruler'];
const names = ['Overview', 'Activity', 'Members'];
const slides = ['Personal', 'Team', 'Studio'];

function Search() {
  const [query, setQuery] = useState('');
  const results = products.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <E.NSearchField label="Filter supplies" value={query} onChangeText={setQuery} />
      <E.NText>{results.join(', ') || 'No results'}</E.NText>
    </>
  );
}

function Email() {
  const [email, setEmail] = useState('');
  const invalid = email.length > 0 && !email.includes('@');
  return (
    <E.NInput
      label="Work email"
      value={email}
      onChangeText={setEmail}
      type="email"
      isInvalid={invalid}
      error={invalid ? 'Enter an email address.' : undefined}
    />
  );
}

function Dismiss() {
  const [open, setOpen] = useState(true);
  return open ? (
    <E.NView className="flex-row items-center gap-3">
      <E.NText>New message</E.NText>
      <E.NCloseButton accessibilityLabel="Dismiss message" onPress={() => setOpen(false)} />
    </E.NView>
  ) : (
    <E.NButton onPress={() => setOpen(true)}>Restore message</E.NButton>
  );
}

function UploadMeter({ label = 'Uploading' }: { label?: string }) {
  const [value, setValue] = useState(25);
  return (
    <>
      <E.NProgress label={label} value={value} max={100} showLabel />
      <E.NButton isOutline onPress={() => setValue(value === 100 ? 0 : value + 25)}>
        {value === 100 ? 'Restart' : 'Advance'}
      </E.NButton>
    </>
  );
}

function WiFi() {
  const [enabled, setEnabled] = useState(false);
  return (
    <>
      <E.NSwitch label="Wi-Fi" value={enabled} onValueChange={setEnabled} />
      <E.NText>Network: {enabled ? 'On' : 'Off'}</E.NText>
    </>
  );
}

function ProjectTabs({ defaultTab }: { defaultTab: string }) {
  return (
    <E.NTabs items={names} defaultValue={defaultTab}>
      {names.map((name) => (
        <E.NTabsContent item={name} key={name}>
          <E.NText>{name} for this project</E.NText>
        </E.NTabsContent>
      ))}
    </E.NTabs>
  );
}

function tabScenario(title: string, defaultTab: string) {
  return scenario(
    title,
    'NTabs, NTabsContent, NText',
    `<NTabs items={['Overview', 'Activity', 'Members']} defaultValue="${defaultTab}">
            {['Overview', 'Activity', 'Members'].map((name) => (
              <NTabsContent item={name} key={name}><NText>{name} for this project</NText></NTabsContent>
            ))}
          </NTabs>`,
    <ProjectTabs defaultTab={defaultTab} />
  );
}

function ControlledCarousel() {
  const [index, setIndex] = useState(0);
  return (
    <>
      <E.NCarousel height={124} value={index} onValueChange={setIndex}>
        {slides.map((plan) => (
          <E.NView className="h-20 w-full rounded-xl border border-border bg-surface p-3" key={plan}>
            <E.NText>{plan} plan</E.NText>
          </E.NView>
        ))}
      </E.NCarousel>
      <E.NButton isOutline onPress={() => setIndex((index + 1) % slides.length)}>
        Next plan
      </E.NButton>
    </>
  );
}

function ExampleList() {
  return (
    <E.NList
      data={products}
      height={170}
      itemSize={44}
      keyExtractor={String}
      renderItem={({ item, index }) => (
        <E.NText className="px-3 py-2">
          {index + 1}. {item}
        </E.NText>
      )}
    />
  );
}

const presentationOptions = {
  dialog: { title: 'Settings dialog', label: 'Edit settings', control: 'NDialog', description: 'Changes apply to this workspace.' },
  sheet: { title: 'Filter sheet', label: 'Show filters', control: 'NSheet', description: 'Choose the content you want to see.' },
  'confirm-alert': {
    title: 'Custom action labels',
    label: 'Archive file',
    control: 'NConfirm',
    description: 'The file can be restored from the archive.'
  }
} as const;
type Presentation = keyof typeof presentationOptions;

function Present({ kind }: { kind: Presentation }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const { label, description, control } = presentationOptions[kind];

  return (
    <>
      <E.NButton onPress={() => setOpen(true)}>{label}</E.NButton>
      {control === 'NConfirm' ? (
        <E.NConfirm
          isOpen={open}
          onOpenChange={setOpen}
          title="Archive this file?"
          description={description}
          confirmText="Archive"
          cancelText="Keep file"
          onResult={(confirmed) => setStatus(confirmed ? 'Archived' : 'Kept')}
        />
      ) : (
        (() => {
          const Overlay = E[control];
          return (
            <Overlay title={label} description={description} isOpen={open} onOpenChange={setOpen}>
              <E.NButton onPress={() => setOpen(false)}>Done</E.NButton>
            </Overlay>
          );
        })()
      )}
      {status && <E.NText>{status}</E.NText>}
    </>
  );
}

function presentationScenario(kind: Presentation): NamedComponentPreview {
  const { title, label, control, description } = presentationOptions[kind];
  const usage =
    control === 'NConfirm'
      ? `<NConfirm isOpen={open} onOpenChange={setOpen} title="Archive this file?" description="${description}"
            confirmText="Archive" cancelText="Keep file" onResult={(confirmed) => setStatus(confirmed ? 'Archived' : 'Kept')} />
          <NText>{status}</NText>`
      : `<${control} isOpen={open} onOpenChange={setOpen} title="${label}" description="${description}">
            <NButton onPress={() => setOpen(false)}>Done</NButton>
          </${control}>`;
  return scenario(
    title,
    `NButton, NText, ${control}`,
    `<NButton onPress={() => setOpen(true)}>${label}</NButton>\n          ${usage}`,
    <Present kind={kind} />,
    `const [open, setOpen] = useState(false);${control === 'NConfirm' ? "\n  const [status, setStatus] = useState('');" : ''}`
  );
}

const calendarDate = new Date(2026, 0, 15);

export const interactiveScenarios = {
  accordion: controlledAccordion,
  alert: scenario(
    'Recover from an error',
    'NAlert, NButton',
    `<NAlert title={saved ? 'Saved' : 'Upload failed'}
            description={saved ? 'Your file is ready.' : 'Retry the example upload.'} />
          <NButton onPress={() => setSaved(!saved)}>{saved ? 'Reset upload' : 'Retry upload'}</NButton>`,
    <RecoveryAlert />,
    'const [saved, setSaved] = useState(false);',
    205
  ),
  button: scenario(
    'Click counter',
    'NButton, NIcon, NText',
    `<NButton leftIcon={<NIcon name="plus" size={16} />} onPress={() => setCount(count + 1)}>Add one</NButton>
          <NText>Count: {count}</NText>`,
    <Counter />,
    'const [count, setCount] = useState(0);'
  ),
  carousel: scenario(
    'Advance with a button',
    'NCarousel, NText, NButton',
    `<NCarousel height={124} value={index} onValueChange={setIndex}>
            {slides.map((plan) => <NView className="h-20 w-full rounded-xl border border-border bg-surface p-3" key={plan}><NText>{plan} plan</NText></NView>)}
          </NCarousel>
          <NButton isOutline onPress={() => setIndex((index + 1) % slides.length)}>Next plan</NButton>`,
    <ControlledCarousel />,
    `const slides = ${JSON.stringify(slides)};\n  const [index, setIndex] = useState(0);`,
    242
  ),
  'close-button': scenario(
    'Dismiss and restore',
    'NCloseButton, NText, NButton',
    `{open
            ? <NView className="flex-row items-center gap-3"><NText>New message</NText>
                <NCloseButton accessibilityLabel="Dismiss message" onPress={() => setOpen(false)} /></NView>
            : <NButton onPress={() => setOpen(true)}>Restore message</NButton>}`,
    <Dismiss />,
    'const [open, setOpen] = useState(true);'
  ),
  'confirm-alert': presentationScenario('confirm-alert'),
  'date-picker': scenario(
    'Restrict available dates',
    'NDatePicker',
    '<NDatePicker label="January appointment" defaultValue={new Date(2026, 0, 15)} minimumDate={new Date(2026, 0, 12)} maximumDate={new Date(2026, 0, 23)} />',
    <E.NDatePicker label="January appointment" defaultValue={calendarDate} minimumDate={new Date(2026, 0, 12)} maximumDate={new Date(2026, 0, 23)} />,
    undefined,
    380
  ),
  dialog: presentationScenario('dialog'),
  input: scenario(
    'Controlled email validation',
    'NInput',
    `<NInput label="Work email" value={email} onChangeText={setEmail} type="email" isInvalid={invalid}
            error={invalid ? 'Enter an email address.' : undefined} />`,
    <Email />,
    "const [email, setEmail] = useState('');\n  const invalid = email.length > 0 && !email.includes('@');"
  ),
  list: scenario(
    'Numbered rows',
    'NList, NText',
    `<NList data={${JSON.stringify(products)}} height={170} itemSize={44} keyExtractor={String}
            renderItem={({ item, index }) => <NText className="px-3 py-2">{index + 1}. {item}</NText>} />`,
    <ExampleList />,
    undefined,
    216
  ),
  press: scenario(
    'Custom counter target',
    'NPress, NText',
    `<NPress className="w-36 rounded-xl bg-accent px-3 py-2" accessibilityLabel="Count presses" onPress={() => setCount(count + 1)}>
            <NText className="text-accent-foreground">Presses: {count}</NText>
          </NPress>`,
    <PressCounter />,
    'const [count, setCount] = useState(0);'
  ),
  progress: scenario(
    'Controlled upload',
    'NProgress, NButton',
    `<NProgress label="Uploading" value={value} max={100} showLabel />
          <NButton isOutline onPress={() => setValue(value === 100 ? 0 : value + 25)}>{value === 100 ? 'Restart' : 'Advance'}</NButton>`,
    <UploadMeter />,
    'const [value, setValue] = useState(25);'
  ),
  'search-field': scenario(
    'Filter a result list',
    'NSearchField, NText',
    `<NSearchField label="Filter supplies" value={query} onChangeText={setQuery} />
          <NText>{results.join(', ') || 'No results'}</NText>`,
    <Search />,
    `const [query, setQuery] = useState('');\n  const results = ${JSON.stringify(products)}.filter((item) => item.toLowerCase().includes(query.toLowerCase()));`
  ),
  sheet: presentationScenario('sheet'),
  switch: scenario(
    'Controlled setting',
    'NSwitch, NText',
    `<NSwitch label="Wi-Fi" value={enabled} onValueChange={setEnabled} />
          <NText>Network: {enabled ? 'On' : 'Off'}</NText>`,
    <WiFi />,
    'const [enabled, setEnabled] = useState(false);'
  ),
  tabs: tabScenario('Project tabs', 'Activity'),
  'tabs-content': tabScenario('Select initial content', 'Members'),
  toast: scenario(
    'Warning and success',
    'NButton, NToast',
    `<NView className="flex-row flex-wrap gap-3">
            <NButton onPress={() => NToast.warning('Your session is about to expire')}>Warn</NButton>
            <NButton isOutline onPress={() => NToast.success('Session extended')}>Extend session</NButton>
          </NView>`,
    <E.NView className="flex-row flex-wrap gap-3">
      <E.NButton onPress={() => E.NToast.warning('Your session is about to expire')}>Warn</E.NButton>
      <E.NButton isOutline onPress={() => E.NToast.success('Session extended')}>
        Extend session
      </E.NButton>
    </E.NView>
  )
};

function PressCounter() {
  const [count, setCount] = useState(0);
  return (
    <E.NPress className="w-36 rounded-xl bg-accent px-3 py-2" accessibilityLabel="Count presses" onPress={() => setCount(count + 1)}>
      <E.NText className="text-accent-foreground">Presses: {count}</E.NText>
    </E.NPress>
  );
}
