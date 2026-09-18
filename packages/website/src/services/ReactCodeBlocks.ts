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

export const inputCode = `import { NInput } from '@nayan-ui/react';
import { useState } from 'react';

const Input = () => {
  const [email, setEmail] = useState('niranjan.devasani@gmail.com');

  return (
    <NInput id="email" type="email" label="Email" placeholder="Enter email" className="mb-3" value={email} onChange={e => setEmail(e.target.value)} />
  );
};

export default Input;`;

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
