export const installCode = `npm install @nayan-ui/react`;

export const tailwindCode = `// No tailwind.config.js needed with Tailwind v4!
// HeroUI styles handle theming automatically.
// Use @tailwindcss/vite plugin in vite.config.ts:

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
});`;

export const cssCode = `@import '@nayan-ui/react/styles.css';

body {
  color: var(--foreground);
  background: var(--background);
}`;

export const appCode = `import { useState } from 'react';
import { NTheme, THEMES, useLocalStorage } from '@nayan-ui/react';

const App = () => {
  const [theme, setTheme] = useLocalStorage('THEME', THEMES.LIGHT);

  const toggleTheme = () => {
    setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
  };

  return (
    <NTheme theme={theme}>
      <div className="p-3" onClick={toggleTheme}>TOGGLE THEME</div>
    </NTheme>
  );
};

export default App;`;

export const accordionCode = `import { NAccordion, AccordionTypes } from '@nayan-ui/react';

const Accordion = () => {
  const items = [
    { title: 'Heading 1', message: 'Description 1' },
    { title: 'Heading 2', message: 'Description 2' }
  ];

  return (
    <div>
      <h1 className="text-foreground mb-3 text-lg">Single:</h1>
      <NAccordion type={AccordionTypes.SINGLE} items={items} />
      <h1 className="text-foreground mb-3 mt-5 text-lg">Multiple:</h1>
      <NAccordion type={AccordionTypes.MULTIPLE} items={items} />
    </div>
  );
};

export default Accordion;`;

export const alertCode = `import { NAlert, AlertTypes } from '@nayan-ui/react';

const Alert = () => {
  return (
    <div>
      <NAlert type={AlertTypes.DEFAULT} message="New version available!" className="mb-3" onClose={() => console.log('Alert closed')} />
      <NAlert type={AlertTypes.INFO} message="New version available!" className="mb-3" onClose={() => console.log('Alert closed')} />
      <NAlert type={AlertTypes.SUCCESS} message="New version available!" className="mb-3" onClose={() => console.log('Alert closed')} />
      <NAlert type={AlertTypes.WARNING} message="New version available!" className="mb-3" onClose={() => console.log('Alert closed')} />
      <NAlert type={AlertTypes.ERROR} title="Error!" message="New version available!" className="mb-3" onClose={() => console.log('Alert closed')} />
    </div>
  );
};

export default Alert;`;

export const badgeCode = `import { NBadge } from '@nayan-ui/react';

const Badge = () => {
  return (
    <div className="flex flex-wrap gap-2">
      <NBadge color="default">Default</NBadge>
      <NBadge color="accent">Accent</NBadge>
      <NBadge color="success">Success</NBadge>
      <NBadge color="warning">Warning</NBadge>
      <NBadge color="danger">Danger</NBadge>
    </div>
  );
};

export default Badge;`;

export const buttonCode = `import { NButton } from '@nayan-ui/react';

const Button = () => {
  return (
    <div className="flex flex-wrap gap-2">
      <NButton onClick={() => console.log('clicked')}>Primary</NButton>
      <NButton isOutline={true}>Outline</NButton>
      <NButton isLoading={true}>Loading</NButton>
      <NButton disabled>Disabled</NButton>
    </div>
  );
};

export default Button;`;

export const buttonGroupCode = `import { useState } from 'react';
import { NButtonGroup } from '@nayan-ui/react';

const items = ['Startup', 'Business', 'Enterprise'];

const ButtonGroup = () => {
  const [selected, setSelected] = useState(items[0]);
  return <NButtonGroup disabled={false} items={items} selected={selected} onChange={setSelected} />;
};

export default ButtonGroup;`;

export const cardCode = `import { NCard } from '@nayan-ui/react';

const Card = () => {
  return <NCard className="p-3">This is sample card.</NCard>
};

export default Card;`;

export const checkBoxCode = `import { useState } from 'react';
import { NCheck, NLink } from '@nayan-ui/react';

const Checkbox = () => {
  const [checked, setChecked] = useState(true);

  return (
    <NCheck checked={checked} disabled={false} onChange={checked => setChecked(checked)}>
      Sample label for checkbox. accept <NLink> terms</NLink>
    </NCheck>
  );
};

export default Checkbox;`;

export const comboBoxCode = `import { NCombo } from '@nayan-ui/react';
import { useState } from 'react';

const items = [
  { value: 'startup', label: 'Startup' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' }
];

const Combobox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(items[0].value);

  return (
    <NCombo
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      selected={selected}
      placeholder="Select Business"
      label="Business Type"
      items={items}
      onChange={setSelected}
    />
  );
};

export default Combobox;`;

export const confirmAlertCode = `import { useState } from 'react';
import { NConfirmAlert, NButton } from '@nayan-ui/react';

const ConfirmAlert = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <NConfirmAlert
        isOpen={isOpen}
        title="Are you absolutely sure?"
        message="This action cannot be undone. This will permanently delete your account and remove your data from our servers."
        onResult={result => console.log('Alert Clicked', result)}
        onClose={() => setIsOpen(false)}
      />
      <NButton onClick={() => setIsOpen(true)}>Show Alert</NButton>
    </div>
  );
};

export default ConfirmAlert;`;

export const dialogCode = `import { useState } from 'react';
import { NButton, NDialog, DialogSize } from '@nayan-ui/react';

const Dialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <NDialog isOpen={isOpen} onClose={() => setIsOpen(false)} size={DialogSize.MD} title="Payment confirmation">
        Your payment has been successfully submitted. We’ve sent you an email with all of the details of your order.
      </NDialog>
      <NButton onClick={() => setIsOpen(true)}>Show Dialog</NButton>
    </div>
  );
};

export default Dialog;`;

export const dividerCode = `import { NDivider } from '@nayan-ui/react';

const Divider = () => {
  return (
    <div>
      <h1 className="text-foreground mb-3 text-lg">Horizontal:</h1>
      <NDivider className="my-3" />
      <h1 className="text-foreground mb-3 text-lg">Vertical:</h1>
      <NDivider orientation="vertical" className="h-5" />
    </div>
  );
};

export default Divider;`;

export const infiniteScrollCode = `import { NCard, NInfiniteScroll, NLoading } from '@nayan-ui/react';
import React, { useState } from 'react';

const InfiniteScroll = () => {
  const [items, setItems] = useState(new Array(20).fill(''));
  const [isFetching, setIsFetching] = useState(false);

  const fetchNextPage = () => {
    setIsFetching(true);
    setTimeout(() => {
      const newItems = [...items, ...new Array(20).fill('')];
      setItems(newItems);
      setIsFetching(false);
    }, 2000);
  };

  return (
    <NInfiniteScroll
      next={() => !isFetching && fetchNextPage()}
      hasMore={true}
      loader={<NLoading />}
      dataLength={items.length}
      scrollThreshold={0.99}>
        {items.map((item: any, index: number) => (
          <NCard className="p-3 mb-3">Item {index}</NCard>
        ))}
    </NInfiniteScroll>
  );
};

export default InfiniteScroll;`;

export const inputCode = `import { NInput } from '@nayan-ui/react';
import { useState } from 'react';

const Input = () => {
  const [email, setEmail] = useState('niranjan.devasani@gmail.com');

  return (
    <NInput id="email" type="email" label="Email" placeholder="Enter email" className="mb-3" value={email} onChange={e => setEmail(e.target.value)} />
  );
};

export default Input;`;

export const inputHookCode = `import { NButton, NFormInput } from '@nayan-ui/react';
import { useForm } from 'react-hook-form';

const FormInput = () => {
  const { control, handleSubmit, formState: { errors },} = useForm({
    defaultValues: {
      email: "niranjan.devasani@gmail.com"
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <NFormInput
        control={control}
        errors={errors}
        name="email"
        id="in1"
        type="email"
        label="Email"
        placeholder="Enter email"
        className="mb-3"
      />
      <NButton type="submit">Submit</NButton>
    </form>
  );
};

export default FormInput;`;

export const linkCode = `import { NLink } from '@nayan-ui/react';

const handleClick = () => alert('Span clicked!');
const doSomething = (e) => alert('Custom action!');

const Link = () => {
  return (
    <>
      <div className="mb-4">
        <NLink href="https://example.com">External Link</NLink>
      </div>

      <div className="mb-4">
        <NLink href="https://example.com" target="_self" rel="nofollow" className="text-blue-700 underline">
          Custom Anchor
        </NLink>
      </div>

      <div className="mb-4">
        <NLink onClick={handleClick}>Clickable Span</NLink>
      </div>

      <div className="mb-4">
        <NLink className="font-bold text-green-700" onClick={handleClick}>
          Styled Span
        </NLink>
      </div>

      <div className="mb-4">
        <NLink href="/about" className="underline text-purple-700">About (Internal Link)</NLink>
        <br />
        <NLink className="cursor-pointer text-orange-700" onClick={doSomething}>
          Do Something
        </NLink>
      </div>

      <div className="mb-4">
        <NLink onClick={handleClick}>Focus me and press Enter or Space</NLink>
      </div>
    </>
  );
};

export default Link;`;

export const linkifyCode = `import { NLinkify } from '@nayan-ui/react';

const Linkify = () => {
  return (
    <NLinkify>Checkout our new landing page at nayanui.com and new email hello@nayanui.com</NLinkify>
  );
};

export default Linkify;`;

export const loadingCode = `import { NLoading } from '@nayan-ui/react';

const Loading = () => {
  return <NLoading className="text-accent" />
};

export default Loading;`;

export const menuCode = `import { NMenu,NMenuItem, MenuSize, NMenuNested, NButton } from '@nayan-ui/react';
import { User } from 'lucide-react';

const Menu = () => {
  return (
    <NMenu align="start" title="My Account" size={MenuSize.LG} trigger={<NButton>Show Menu</NButton>}>
      <NMenuItem title="Profile" icon={User} shortcut="⌘P" />
      <NMenuNested trigger={<NMenuItem title="Share" icon={User} className="p-0" />}>
        <NMenuItem title="Facebook" icon={User} shortcut="⌘P" />
        <NMenuItem title="Twitter" icon={User} shortcut="⌘P" />
      </NMenuNested>
      <NMenuItem title="Settings" icon={User} shortcut="⌘P" separator={true} />
      <NMenuItem title="Logout" icon={User} shortcut="⌘P" />
    </NMenu>
  );
};

export default Menu;`;

export const popoverCode = `import { NPopover, NButton, PopoverSize } from '@nayan-ui/react';

const Popover = () => {
  return (
    <NPopover size={PopoverSize.MD} trigger={<NButton>Show Popover</NButton>}>
      <div className="overflow-hidden p-3">
        <div className="text-sm font-medium text-foreground">Documentation</div>
        <div className="text-sm text-muted">Start integrating products and tools</div>
      </div>
    </NPopover>
  );
};

export default Popover;`;

export const progressCode = `import { NProgress } from '@nayan-ui/react';

const Progress = () => {
  return <NProgress value={50} />;
};

export default Progress;`;

export const radioGroupCode = `import { useState } from 'react';
import { NRadioGroup } from '@nayan-ui/react';

const items = [
  { value: 'startup', label: 'Startup' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' }
];

const RadioGroupExample = () => {
  const [selected, setSelected] = useState(items[0].value);

  return (
    <div>
      <h1 className="text-foreground mb-3 text-base">Horizontal:</h1>
      <NRadioGroup items={items} selected={selected} setSelected={setSelected} />
      <div className="mt-5" />
      <h1 className="text-foreground mb-3 text-base">Vertical:</h1>
      <NRadioGroup orientation="vertical" items={items} selected={selected} setSelected={setSelected} />
    </div>
  );
};

export default RadioGroup;`;

export const selectCode = `import { useState } from 'react';
import { NSelect } from '@nayan-ui/react';

const items = [
  { value: 'startup', label: 'Startup' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' }
];

const Select = () => {
  const [selected, setSelected] = useState(items[0]);
  return (
    <NSelect
      isMulti={true}
      isCreatable={true}
      placeholder="Select something..."
      isClearable={true}
      isSearchable={true}
      isDisabled={false}
      value={selected}
      options={items}
      onCreateOptions={value => console.log(value)}
      onChangeOptions={values => setSelected(values)}
    />
  );
};

export default Select;`;

export const sheetCode = `import { useState } from 'react';
import { NSheet, NButton, Size } from '@nayan-ui/react';

const SheetExample = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <NButton onClick={() => setIsOpen(true)}>Show Sheet</NButton>
      <NSheet isOpen={isOpen} size={Size.SM} title="Edit Profile" onCloseSheet={() => setIsOpen(false)}>
        <div className="w-full h-full p-3">
          Your payment has been successfully submitted. We’ve sent you an email with all of the details of your order.
        </div>
      </NSheet>
    </div>
  );
};

export default Sheet;`;

export const skeletonCode = `import { NSkeleton } from '@nayan-ui/react';

const Skeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      <NSkeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <NSkeleton className="h-4 w-[250px]" />
        <NSkeleton className="h-4 w-[180px]" />
      </div>
    </div>
  );
};

export default Skeleton;`;

export const sliderCode = `import { NSlider } from '@nayan-ui/react';

const Slider = () => {
  return (
    <NSlider defaultValue={50} max={100} step={1} disabled={false} onChange={value => console.log(value)} />
  );
};

export default Slider;`;

export const switchCode = `import { useState } from 'react';
import { NSwitch } from '@nayan-ui/react';

const Switch = () => {
  const [enabled, setEnabled] = useState(false);
  return <NSwitch label="Is Dark Mode" enabled={enabled} onChange={setEnabled} />;
};

export default Switch;`;

export const tableCode = `import { NTable } from '@nayan-ui/react';

const CustomComponent = ({row, col, ...remaining}: any) => {
  return <div className="text-accent">Oops</div>;
};

const Table = () => {
  const columnDef = [
    { name: 'invoice', title: 'Invoice', className: 'w-[100px]' },
    { name: 'status', title: 'Status' },
    { name: 'method', title: 'Method' },
    { name: 'amount', title: 'Amount', className: 'text-right' },
    { name: 'custom', title: 'Custom', className: 'text-right', component: CustomComponent }
  ];

  const data = [
    { invoice: '10001', status: 'Completed', method: 'Credit Card', amount: '$1000' },
    { invoice: '10002', status: 'In progress', method: 'Net Banking', amount: '$500' }
  ];

  return <NTable className="bg-surface" caption="Invoice table" columnDef={columnDef} data={data} />;
};

export default Table;`;

export const tabsCode = `import { useState } from 'react';
import { NTabs, NTabsContent } from '@nayan-ui/react';

const items = ['POSTS', 'SAVED'];

const Tabs = () => {
  const [selected, setSelected] = useState(items[0]);

  return (
    <div>
      <h1 className="text-foreground mb-3 text-lg text-left">Tabs:</h1>
      <NTabs items={items} selected={selected} onChange={setSelected}>
        <NTabsContent item={items[0]} className="px-3 py-2 text-foreground">
          Content 1
        </NTabsContent>
        <NTabsContent item={items[1]} className="px-3 py-2 text-foreground">
          Content 2
        </NTabsContent>
      </NTabs>
      <h1 className="text-foreground mb-3 mt-5 text-lg text-left">Full Width:</h1>
      <NTabs isFull={true} items={items} selected={selected} onChange={setSelected}>
        <NTabsContent item={items[0]} className="px-3 py-2 text-foreground">
          Content 3
        </NTabsContent>
        <NTabsContent item={items[1]} className="px-3 py-2 text-foreground">
          Content 4
        </NTabsContent>
      </NTabs>
    </div>
  );
};

export default Tabs;`;

export const textareaCode = `import { useState } from 'react';
import { NTextarea } from '@nayan-ui/react';

const Textarea = () => {
  const [address, setAddress] = useState('Bangalore, India');

  return (
    <NTextarea
      id="ta1"
      label="Address"
      placeholder="Enter address"
      className="mb-3"
      rows={3}
      value={address}
      onChange={e => setAddress(e.target.value)}
    />
  );
};

export default Textarea;`;

export const toastCode = `import { NButton, useNToast } from '@nayan-ui/react';

const Toast = () => {
  const toast = useNToast();
  return (
    <NButton onClick={() => toast('This is a toast notification!', 'Success')}>
      Show Toast
    </NButton>
  );
};

export default Toast;`;

export const tooltipCode = `import { NTooltip, NButton } from '@nayan-ui/react';

const Tooltip = () => {
  return (
    <NTooltip message="This is sample tool tip! This is sample tool tip This is sample tool tip This is sample tool tip ">
      <NButton>Show Tooltip</NButton>
    </NTooltip>
  );
};

export default Tooltip;`;
