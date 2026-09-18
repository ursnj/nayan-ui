export const installCode = `npm install @nayan-ui/react`;
export const rnInstallCode = `npm install @nayan-ui/native`;
export const rnPeerDepsCode = `npm install react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens react-native-svg react-native-worklets`;

export const tailwindCode = `// No tailwind.config.js needed with Tailwind v4!
// HeroUI styles handle theming automatically.
// Use @tailwindcss/vite plugin in vite.config.ts:

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
});`;

export const rnTailwindCode = `// No tailwind.config.js needed!
// Uniwind + HeroUI Native handle styling automatically.
// Just create a global.css file:`;

export const cssCode = `@import '@nayan-ui/react/styles.css';

body {
  color: var(--foreground);
  background: var(--background);
}`;

export const rnCssCode = `@import 'tailwindcss';
@import 'uniwind';
@import 'heroui-native/styles';`;

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

export const rnAppCode = `import { View } from 'react-native';
import { NButton, NTheme, NThemeToggle, useNTheme } from '@nayan-ui/native';
import './global.css';

export default function App() {
  const { isDarkMode } = useNTheme();

  return (
    <NTheme>
      <View className="flex-1 justify-center items-center bg-background">
        <NThemeToggle />
        <NButton onPress={() => console.log('Pressed!')}>
          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
        </NButton>
      </View>
    </NTheme>
  );
}`;

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
  const [notifications, setNotifications] = useState(true);
  const [terms, setTerms] = useState(false);

  return (
    <div className="space-y-3">
      <NCheck checked={notifications} onChange={setNotifications}>
        Enable email notifications
      </NCheck>
      <NCheck checked={terms} onChange={setTerms}>
        I agree to the <NLink href="#">Terms of Service</NLink>
      </NCheck>
      <NCheck checked={false} disabled onChange={() => {}}>
        This option is disabled
      </NCheck>
    </div>
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
      <NDivider orientation="horizontal" className="my-3" />
      <h1 className="text-foreground mb-3 text-lg">Horizontal with Text:</h1>
      <NDivider orientation="horizontal" className="h-5">OR</NDivider>
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

export const menuCode = `import { MenuSize, NMenu, NMenuItem, NMenuNested } from '@nayan-ui/react';
import { LogOut, Settings, Share2, User } from 'lucide-react';

const Menu = () => {
  return (
    // The trigger is rendered inside a button already — pass content, not a <NButton>.
    <NMenu title="My Account" size={MenuSize.LG} placement="bottom" trigger="Show Menu">
      <NMenuItem id="profile" title="Profile" icon={User} shortcut="⌘P" onAction={() => console.log('Profile')} />
      {/* separator draws a divider *after* this item, so it goes on the item
          above the group you are separating — never on the last one. */}
      <NMenuItem id="settings" title="Settings" icon={Settings} shortcut="⌘," separator onAction={() => console.log('Settings')} />
      {/* NMenuNested takes the label itself — passing an NMenuItem as the
          trigger would nest one menu item inside another. */}
      <NMenuNested trigger="Share" icon={<Share2 className="h-4 w-4 shrink-0" />}>
        <NMenuItem id="facebook" title="Facebook" onAction={() => console.log('Facebook')} />
        <NMenuItem id="twitter" title="Twitter" onAction={() => console.log('Twitter')} />
      </NMenuNested>
      <NMenuItem id="logout" title="Logout" icon={LogOut} shortcut="⇧⌘Q" onAction={() => console.log('Logout')} />
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
  return (
    <>
      <NProgress value={50} />
      {/* showLabel renders the label and percentage above the bar. */}
      <NProgress value={72} label="Uploading" showLabel />
    </>
  );
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
  const [value, setValue] = useState(items[0].value);

  return (
    <div>
      <h1 className="text-foreground mb-3 text-base">Horizontal:</h1>
      <NRadioGroup label="Plan" items={items} value={value} onChange={setValue} />
      <div className="mt-5" />
      <h1 className="text-foreground mb-3 text-base">Vertical:</h1>
      <NRadioGroup orientation="vertical" label="Plan" items={items} value={value} onChange={setValue} />
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
      label="Business type"
      placeholder="Search businesses..."
      isSearchable
      isClearable
      value={selected}
      options={items}
      onChange={setSelected}
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

export const datePickerCode = `import { NDatePicker } from '@nayan-ui/react';

const DatePicker = () => {
  return <NDatePicker label="Date of birth" helperText="Select your date of birth" />;
};

export default DatePicker;`;

export const numberFieldCode = `import { useState } from 'react';
import { NNumberField } from '@nayan-ui/react';

const NumberField = () => {
  const [value, setValue] = useState(1);

  return (
    <NNumberField
      value={value}
      onChange={setValue}
      minValue={0}
      maxValue={100}
      aria-label="Quantity"
    />
  );
};

export default NumberField;`;

export const meterCode = `import { NMeter } from '@nayan-ui/react';

const Meter = () => {
  return (
    <div className="space-y-4">
      <NMeter value={30} color="accent" label="Storage" />
      <NMeter value={80} color="warning" label="Memory" />
      <NMeter value={95} color="danger" label="CPU" output="95% — critical" />
    </div>
  );
};

export default Meter;`;

export const tagGroupCode = `import { useState } from 'react';
import { NTagGroup } from '@nayan-ui/react';

const items = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'angular', label: 'Angular' }
];

const TagGroup = () => {
  const [selected, setSelected] = useState(new Set(['react']));

  return (
    <NTagGroup
      items={items}
      selectionMode="multiple"
      selectedKeys={selected}
      onSelectionChange={setSelected}
    />
  );
};

export default TagGroup;`;

export const searchFieldCode = `import { useState } from 'react';
import { NSearchField } from '@nayan-ui/react';

const SearchField = () => {
  const [query, setQuery] = useState('');

  return (
    <NSearchField
      value={query}
      onChange={setQuery}
      placeholder="Search components..."
    />
  );
};

export default SearchField;`;

export const tooltipCode = `import { NTooltip, NButton } from '@nayan-ui/react';

const Tooltip = () => {
  return (
    <NTooltip message="This is sample tool tip! This is sample tool tip This is sample tool tip This is sample tool tip ">
      <NButton>Show Tooltip</NButton>
    </NTooltip>
  );
};

export default Tooltip;`;

export const avatarCode = `import { NAvatar } from '@nayan-ui/react';

const Avatar = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Colors:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <NAvatar fallback="ND" />
        <NAvatar fallback="AK" color="accent" variant="soft" />
        <NAvatar fallback="RS" color="success" variant="soft" />
        <NAvatar fallback="JP" color="warning" variant="soft" />
        <NAvatar fallback="MM" color="danger" variant="soft" />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Sizes:</h3>
      <div className="flex flex-wrap items-center gap-2">
        <NAvatar fallback="SM" size="sm" color="accent" variant="soft" />
        <NAvatar fallback="MD" size="md" color="accent" variant="soft" />
        <NAvatar fallback="LG" size="lg" color="accent" variant="soft" />
      </div>
    </div>
  );
};

export default Avatar;`;

export const avatarGroupCode = `import { NAvatarGroup } from '@nayan-ui/react';

const members = [{ fallback: 'ND' }, { fallback: 'AK' }, { fallback: 'RS' }, { fallback: 'JP' }, { fallback: 'MM' }];

const AvatarGroup = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Collapsed after three:</h3>
      <div className="mb-5">
        <NAvatarGroup items={members} max={3} color="accent" variant="soft" />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">All of them, as a grid:</h3>
      <NAvatarGroup items={members} isGrid color="accent" variant="soft" />
    </div>
  );
};

export default AvatarGroup;`;

export const breadcrumbsCode = `import { NBreadcrumbs } from '@nayan-ui/react';

const items = [{ label: 'Home', href: '/' }, { label: 'React', href: '/react/components' }, { label: 'Breadcrumbs' }];

const Breadcrumbs = () => {
  return (
    <div>
      <NBreadcrumbs items={items} />
    </div>
  );
};

export default Breadcrumbs;`;

export const calendarCode = `import { useState } from 'react';
import { NCalendar } from '@nayan-ui/react';
import { getLocalTimeZone, today } from '@internationalized/date';

const Calendar = () => {
  const [value, setValue] = useState<any>(today(getLocalTimeZone()));

  return (
    <div>
      <NCalendar value={value} onChange={setValue} aria-label="Pick a date" />
    </div>
  );
};

export default Calendar;`;

export const checkGroupCode = `import { useState } from 'react';
import { NCheckGroup } from '@nayan-ui/react';

const items = [
  { label: 'Email', value: 'email' },
  { label: 'Push', value: 'push' },
  { label: 'SMS', value: 'sms', disabled: true }
];

const CheckboxGroup = () => {
  const [value, setValue] = useState<string[]>(['email']);

  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Vertical:</h3>
      <div className="mb-5">
        <NCheckGroup label="Notify me by" items={items} value={value} onChange={setValue} />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Horizontal:</h3>
      <NCheckGroup label="Notify me by" items={items} value={value} onChange={setValue} orientation="horizontal" />
    </div>
  );
};

export default CheckboxGroup;`;

export const chipCode = `import { NChip } from '@nayan-ui/react';

const Chip = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Colors:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <NChip color="default">Default</NChip>
        <NChip color="accent">Accent</NChip>
        <NChip color="success">Success</NChip>
        <NChip color="warning">Warning</NChip>
        <NChip color="danger">Danger</NChip>
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Variants:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <NChip color="accent" variant="primary">
          Primary
        </NChip>
        <NChip color="accent" variant="secondary">
          Secondary
        </NChip>
        <NChip color="accent" variant="tertiary">
          Tertiary
        </NChip>
        <NChip color="accent" variant="soft">
          Soft
        </NChip>
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Sizes:</h3>
      <div className="flex flex-wrap items-center gap-2">
        <NChip color="accent" size="sm">
          Small
        </NChip>
        <NChip color="accent" size="md">
          Medium
        </NChip>
        <NChip color="accent" size="lg">
          Large
        </NChip>
      </div>
    </div>
  );
};

export default Chip;`;

export const dateFieldCode = `import { useState } from 'react';
import { NDateField } from '@nayan-ui/react';
import { getLocalTimeZone, today } from '@internationalized/date';

const DateField = () => {
  const [value, setValue] = useState<any>(today(getLocalTimeZone()));

  return (
    <div>
      <div className="max-w-sm">
        <NDateField label="Starts" value={value} onChange={setValue} helperText="Type it, or step the segments with the arrow keys." />
      </div>
    </div>
  );
};

export default DateField;`;

export const dateRangePickerCode = `import { useState } from 'react';
import { NDateRangePicker } from '@nayan-ui/react';
import { getLocalTimeZone, today } from '@internationalized/date';

const DateRangePicker = () => {
  const [value, setValue] = useState<any>({ start: today(getLocalTimeZone()), end: today(getLocalTimeZone()).add({ days: 6 }) });

  return (
    <div>
      <div className="max-w-md">
        <NDateRangePicker label="Reporting period" value={value} onChange={setValue} />
      </div>
    </div>
  );
};

export default DateRangePicker;`;

export const disclosureCode = `import { NDisclosure } from '@nayan-ui/react';

const Disclosure = () => {
  return (
    <div>
      <NDisclosure title="What is included?" defaultExpanded>
        Every component in the library, the source, and the right to ship it in anything you like.
      </NDisclosure>
      <NDisclosure title="Do I need a licence key?">No. It is MIT licensed and there is nothing to activate.</NDisclosure>
    </div>
  );
};

export default Disclosure;`;

export const emptyStateCode = `import { NButton, NEmptyState } from '@nayan-ui/react';
import { Inbox } from 'lucide-react';

const EmptyState = () => {
  return (
    <div>
      <NEmptyState
        icon={<Inbox className="h-8 w-8" />}
        title="No projects yet"
        message="Create your first project and it will show up here."
        actions={<NButton>New project</NButton>}
      />
    </div>
  );
};

export default EmptyState;`;

export const inputOtpCode = `import { useState } from 'react';
import { NInputOtp } from '@nayan-ui/react';

const InputOTP = () => {
  const [code, setCode] = useState('');

  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Six digits, split into two groups:</h3>
      <div className="mb-5">
        <NInputOtp maxLength={6} value={code} onChange={setCode} separatorIndices={[2]} onComplete={value => console.log('Complete', value)} />
      </div>
      <p className="text-sm text-muted">Value: {code || 'Empty'}</p>
    </div>
  );
};

export default InputOTP;`;

export const kbdCode = `import { NKbd } from '@nayan-ui/react';

const KeyboardKey = () => {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <NKbd>⌘</NKbd>
        <NKbd>K</NKbd>
        <span>opens the search, and</span>
        <NKbd>Esc</NKbd>
        <span>closes it.</span>
      </div>
    </div>
  );
};

export default KeyboardKey;`;

export const listBoxCode = `import { useState } from 'react';
import { NListBox } from '@nayan-ui/react';

const items = [
  { id: 'report', label: 'Quarterly report.pdf', description: '2.4 MB · PDF' },
  { id: 'budget', label: 'Budget.xlsx', description: '812 KB · Spreadsheet' },
  { id: 'archive', label: 'Archive.zip', description: '18 MB · Archive', disabled: true }
];

const ListBox = () => {
  const [selected, setSelected] = useState<any>(new Set(['report']));

  return (
    <div>
      <NListBox items={items} selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected} aria-label="Files" />
    </div>
  );
};

export default ListBox;`;

export const paginationCode = `import { useState } from 'react';
import { NPagination } from '@nayan-ui/react';

const Pagination = () => {
  const [page, setPage] = useState(3);

  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Nine pages:</h3>
      <div className="mb-5">
        <NPagination totalPages={9} currentPage={page} onChange={setPage} />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">With a summary:</h3>
      <NPagination totalPages={40} currentPage={page} onChange={setPage} showSummary />
    </div>
  );
};

export default Pagination;`;

export const progressCircleCode = `import { NProgressCircle } from '@nayan-ui/react';

const ProgressCircle = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Colors and sizes:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-5">
        <NProgressCircle value={25} aria-label="Upload" />
        <NProgressCircle value={60} color="success" size="lg" aria-label="Sync" />
        <NProgressCircle value={90} color="warning" size="sm" aria-label="Disk" />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Indeterminate:</h3>
      <NProgressCircle isIndeterminate aria-label="Working" />
    </div>
  );
};

export default ProgressCircle;`;

export const scrollShadowCode = `import { NScrollShadow } from '@nayan-ui/react';

const ScrollShadow = () => {
  return (
    <div>
      <NScrollShadow className="h-40 max-w-sm rounded-xl border border-default p-3">
        <div className="space-y-2 text-sm text-muted">
          {Array.from({ length: 16 }, (_, index) => (
            <p key={index}>Row {index + 1} — scroll to see the shadows come and go.</p>
          ))}
        </div>
      </NScrollShadow>
    </div>
  );
};

export default ScrollShadow;`;

export const switchGroupCode = `import { useState } from 'react';
import { NSwitchGroup } from '@nayan-ui/react';

const items = [
  { label: 'Release notes', value: 'releases' },
  { label: 'Security alerts', value: 'security' },
  { label: 'Weekly digest', value: 'digest' }
];

const SwitchGroup = () => {
  const [value, setValue] = useState<string[]>(['releases', 'security']);

  return (
    <div>
      <div className="max-w-sm">
        <NSwitchGroup label="Email me about" items={items} value={value} onChange={setValue} />
      </div>
    </div>
  );
};

export default SwitchGroup;`;

export const timeFieldCode = `import { useState } from 'react';
import { NTimeField } from '@nayan-ui/react';
import { Time } from '@internationalized/date';

const TimeField = () => {
  const [value, setValue] = useState<any>(new Time(9, 30));

  return (
    <div>
      <div className="max-w-sm">
        <NTimeField label="Starts at" value={value} onChange={setValue} />
        <NTimeField label="24-hour" value={value} onChange={setValue} hourCycle={24} />
      </div>
    </div>
  );
};

export default TimeField;`;

export const toggleButtonCode = `import { useState } from 'react';
import { NToggleButton } from '@nayan-ui/react';
import { Bold, Italic, Underline } from 'lucide-react';

const ToggleButton = () => {
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);

  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Icon only:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <NToggleButton isIconOnly aria-label="Bold" isSelected={bold} onChange={setBold}>
          <Bold className="h-4 w-4" />
        </NToggleButton>
        <NToggleButton isIconOnly aria-label="Italic" isSelected={italic} onChange={setItalic}>
          <Italic className="h-4 w-4" />
        </NToggleButton>
        <NToggleButton isIconOnly aria-label="Underline" disabled>
          <Underline className="h-4 w-4" />
        </NToggleButton>
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">With a label:</h3>
      <div className="flex flex-wrap items-center gap-2">
        <NToggleButton size="sm">Small</NToggleButton>
        <NToggleButton>Medium</NToggleButton>
        <NToggleButton variant="ghost">Ghost</NToggleButton>
      </div>
    </div>
  );
};

export default ToggleButton;`;

export const toolbarCode = `import { useState } from 'react';
import { NToggleButton, NToolbar } from '@nayan-ui/react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';

const Toolbar = () => {
  const [align, setAlign] = useState('left');

  return (
    <div>
      <NToolbar aria-label="Text alignment">
        <NToggleButton isIconOnly aria-label="Align left" isSelected={align === 'left'} onChange={() => setAlign('left')}>
          <AlignLeft className="h-4 w-4" />
        </NToggleButton>
        <NToggleButton isIconOnly aria-label="Align centre" isSelected={align === 'center'} onChange={() => setAlign('center')}>
          <AlignCenter className="h-4 w-4" />
        </NToggleButton>
        <NToggleButton isIconOnly aria-label="Align right" isSelected={align === 'right'} onChange={() => setAlign('right')}>
          <AlignRight className="h-4 w-4" />
        </NToggleButton>
      </NToolbar>
    </div>
  );
};

export default Toolbar;`;
