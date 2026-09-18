/*
 * Usage samples for the React Native pages, generated from the example app's
 * screens (packages/native/example/app) so the code on a page is the code that
 * produced the screenshot above it. The app's `Screen` wrapper is replaced by
 * the plain `View` a reader would write in their own screen.
 *
 * Regenerate after changing an example screen.
 */

export const accordionCode = `import { View } from 'react-native';
import { NAccordion, NText } from '@nayan-ui/native';

export default function AccordionScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Single (default)</NText>
      <NAccordion
        items={[
          { title: 'What is React Native?', content: 'A framework for building native apps using React.' },
          { title: 'What is Expo?', content: 'A set of tools for building React Native apps faster.' },
          { title: 'What is HeroUI?', content: 'A component library for React Native.' }
        ]}
      />

      <NText className="text-lg font-bold">Multiple selection</NText>
      <NAccordion
        selectionMode="multiple"
        items={[
          { title: 'Item A', content: 'Content A' },
          { title: 'Item B', content: 'Content B' },
          { title: 'Item C', content: 'Content C' }
        ]}
      />

      <NText className="text-lg font-bold">With disabled item</NText>
      <NAccordion
        items={[
          { title: 'Enabled', content: 'You can expand this.' },
          { title: 'Disabled', content: 'Cannot expand.', isDisabled: true }
        ]}
      />

      <NText className="text-lg font-bold">Surface variant</NText>
      <NAccordion
        variant="surface"
        items={[
          { title: 'Surface A', content: 'Content in surface variant.' },
          { title: 'Surface B', content: 'Another surface item.' }
        ]}
      />
    </View>
  );
}`;

export const alertCode = `import { View } from 'react-native';
import { NAlert, NText } from '@nayan-ui/native';

export default function AlertScreen() {
  return (
    <View className="p-4 gap-3">
      <NText className="text-lg font-bold">Default</NText>
      <NAlert title="Heads up!" description="This is a default alert." />

      <NText className="text-lg font-bold">Accent</NText>
      <NAlert status="accent" title="New update" description="A new version is available." />

      <NText className="text-lg font-bold">Success</NText>
      <NAlert status="success" title="Saved" description="Your changes have been saved." />

      <NText className="text-lg font-bold">Warning</NText>
      <NAlert status="warning" title="Warning" description="Your session is about to expire." />

      <NText className="text-lg font-bold">Danger</NText>
      <NAlert status="danger" title="Error" description="Something went wrong." />

      <NText className="text-lg font-bold">Title only</NText>
      <NAlert title="Simple alert without description" />

      <NText className="text-lg font-bold">Long description</NText>
      <NAlert
        status="accent"
        title="Important"
        description="This is a much longer description that wraps across multiple lines to show how the alert handles longer content gracefully."
      />

      <NText className="text-lg font-bold">With close button</NText>
      <NAlert status="accent" title="Dismissible" description="Tap the close button to dismiss." onClose={() => console.log('closed')} />
      <NAlert status="success" title="Upload complete" description="Your file has been uploaded." onClose={() => console.log('closed')} />
      <NAlert status="warning" title="Low storage" description="You are running low on storage." onClose={() => console.log('closed')} />
    </View>
  );
}`;

export const buttonCode = `import { View } from 'react-native';
import { NButton, NText } from '@nayan-ui/native';

export default function ButtonScreen() {
  return (
    <View className="p-4 gap-3">
      <NText className="text-lg font-bold">Variants</NText>
      <NButton variant="primary" onPress={() => {}}>
        Primary
      </NButton>
      <NButton variant="secondary" onPress={() => {}}>
        Secondary
      </NButton>
      <NButton variant="outline" onPress={() => {}}>
        Outline
      </NButton>
      <NButton variant="danger" onPress={() => {}}>
        Danger
      </NButton>
      <NButton variant="ghost" onPress={() => {}}>
        Ghost
      </NButton>

      <NText className="text-lg font-bold">Sizes</NText>
      <NButton size="sm" onPress={() => {}}>
        Small
      </NButton>
      <NButton size="md" onPress={() => {}}>
        Medium (default)
      </NButton>
      <NButton size="lg" onPress={() => {}}>
        Large
      </NButton>

      <NText className="text-lg font-bold">Disabled</NText>
      <NButton isDisabled onPress={() => {}}>
        Disabled Primary
      </NButton>
      <NButton variant="outline" isDisabled onPress={() => {}}>
        Disabled Outline
      </NButton>

      <NText className="text-lg font-bold">Full width</NText>
      <NButton className="w-full" onPress={() => {}}>
        Full Width
      </NButton>
    </View>
  );
}`;

export const buttonGroupCode = `import { View } from 'react-native';
import { useState } from 'react';
import { NButtonGroup, NText } from '@nayan-ui/native';

export default function ButtonGroupScreen() {
  const [align, setAlign] = useState('left');
  const [size, setSize] = useState('md');

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NButtonGroup
        items={[
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' }
        ]}
        value={align}
        onValueChange={setAlign}
      />
      <NText>Selected: {align}</NText>

      <NText className="text-lg font-bold">Different items</NText>
      <NButtonGroup
        items={[
          { label: 'S', value: 'sm' },
          { label: 'M', value: 'md' },
          { label: 'L', value: 'lg' },
          { label: 'XL', value: 'xl' }
        ]}
        value={size}
        onValueChange={setSize}
      />

      <NText className="text-lg font-bold">Disabled</NText>
      <NButtonGroup
        isDisabled
        items={[
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' }
        ]}
        value="a"
        onValueChange={() => {}}
      />
    </View>
  );
}`;

export const cardCode = `import { View } from 'react-native';
import { NButton, NCard, NText } from '@nayan-ui/native';

export default function CardScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Default</NText>
      <NCard>
        <NText className="font-bold text-lg">Card Title</NText>
        <NText className="text-muted mt-1">This is the card body text.</NText>
      </NCard>

      <NText className="text-lg font-bold">Secondary</NText>
      <NCard variant="secondary">
        <NText className="font-bold">Secondary Card</NText>
        <NText className="text-muted mt-1">Different background.</NText>
      </NCard>

      <NText className="text-lg font-bold">Tertiary</NText>
      <NCard variant="tertiary">
        <NText className="font-bold">Tertiary Card</NText>
        <NText className="text-muted mt-1">Even subtler.</NText>
      </NCard>

      <NText className="text-lg font-bold">With action</NText>
      <NCard>
        <NText className="font-bold text-lg">Upgrade Plan</NText>
        <NText className="text-muted mt-1">Get more features with Pro.</NText>
        <NButton className="mt-3" size="sm" onPress={() => {}}>
          Upgrade
        </NButton>
      </NCard>
    </View>
  );
}`;

export const checkBoxCode = `import { View } from 'react-native';
import { useState } from 'react';
import { NCheck, NText } from '@nayan-ui/native';

export default function CheckScreen() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(true);

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NCheck label="Accept terms and conditions" isSelected={a} onSelectedChange={setA} />
      <NText>Checked: {a ? 'Yes' : 'No'}</NText>

      <NText className="text-lg font-bold">Pre-checked</NText>
      <NCheck label="Receive newsletters" isSelected={b} onSelectedChange={setB} />

      <NText className="text-lg font-bold">Disabled</NText>
      <NCheck label="Disabled unchecked" isSelected={false} isDisabled onSelectedChange={() => {}} />
      <NCheck label="Disabled checked" isSelected isDisabled onSelectedChange={() => {}} />
    </View>
  );
}`;

export const dialogCode = `import { useState } from 'react';
import { View } from 'react-native';
import { NButton, NDialog, NText } from '@nayan-ui/native';

export default function DialogScreen() {
  const [open, setOpen] = useState(false);

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Trigger-based</NText>
      <NDialog title="Welcome" trigger={<NButton>Open Dialog</NButton>}>
        <View className="">
          <NText>This dialog opened from a trigger button.</NText>
        </View>
      </NDialog>

      <NText className="text-lg font-bold">Controlled</NText>
      <NButton onPress={() => setOpen(true)}>Open Controlled</NButton>
      <NDialog title="Controlled Dialog" isOpen={open} onOpenChange={setOpen}>
        <View className="">
          <NText>Controlled via isOpen / onOpenChange.</NText>
          <NButton className="mt-3" variant="outline" onPress={() => setOpen(false)}>
            Close
          </NButton>
        </View>
      </NDialog>

      <NText className="text-lg font-bold">With description</NText>
      <NDialog title="Terms" description="Please read carefully." trigger={<NButton variant="outline">Terms</NButton>}>
        <View className="">
          <NText>By using this app you agree to our terms of service and privacy policy.</NText>
        </View>
      </NDialog>
    </View>
  );
}`;

export const dividerCode = `import { View } from 'react-native';
import { NDivider, NText } from '@nayan-ui/native';

export default function DividerScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Horizontal (default)</NText>
      <NText>Above</NText>
      <NDivider />
      <NText>Below</NText>

      <NText className="text-lg font-bold">Vertical</NText>
      <View className="flex-row items-center gap-3 h-10">
        <NText>Left</NText>
        <NDivider orientation="vertical" />
        <NText>Right</NText>
      </View>

      <NText className="text-lg font-bold">Custom thickness</NText>
      <NDivider thickness={3} />
    </View>
  );
}`;

export const inputCode = `import { View } from 'react-native';
import { NInput, NText } from '@nayan-ui/native';

export default function InputScreen() {
  return (
    <View className="p-4 gap-1">
      <NText className="text-lg font-bold">Basic</NText>
      <NInput label="Name" />

      <NText className="text-lg font-bold">With description</NText>
      <NInput label="Email" description="We'll never share your email." />

      <NText className="text-lg font-bold">Required</NText>
      <NInput label="Username" isRequired />

      <NText className="text-lg font-bold">Invalid with error</NText>
      <NInput label="Password" isInvalid errorMessage="Password must be at least 8 characters." />

      <NText className="text-lg font-bold">Disabled</NText>
      <NInput label="Organization" isDisabled />

      <NText className="text-lg font-bold">Multiline (textarea)</NText>
      <NInput label="Bio" multiline description="Tell us about yourself." />

      <NText className="text-lg font-bold">All combined</NText>
      <NInput label="Phone" description="Include country code." isRequired isInvalid errorMessage="Invalid phone number." />
    </View>
  );
}`;

export const loadingCode = `import { View } from 'react-native';
import { NLoading, NText } from '@nayan-ui/native';

export default function LoadingScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Sizes</NText>
      <View className="flex-row gap-6 items-center">
        <NLoading size="sm" />
        <NLoading size="md" />
        <NLoading size="lg" />
      </View>

      <NText className="text-lg font-bold">Not loading</NText>
      <NLoading isLoading={false} />
      <NText className="text-muted">Nothing shows when isLoading=false</NText>

      <NText className="text-lg font-bold">In container</NText>
      <View className="h-32 bg-surface rounded-lg">
        <NLoading size="lg" containerClassName="flex-1 justify-center items-center" />
      </View>
    </View>
  );
}`;

export const menuCode = `import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NButton, NMenu, NMenuItem, NSubMenu, NText } from '@nayan-ui/native';

export default function MenuScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic menu</NText>
      <NMenu trigger={<NButton variant="outline">Open Menu</NButton>} title="Actions">
        <NMenuItem title="Edit" icon={<Ionicons name="create-outline" size={16} />} onPress={() => console.log('Edit')} />
        <NMenuItem title="Duplicate" icon={<Ionicons name="copy-outline" size={16} />} onPress={() => console.log('Duplicate')} />
        <NMenuItem title="Archive" icon={<Ionicons name="archive-outline" size={16} />} onPress={() => console.log('Archive')} />
      </NMenu>

      <NText className="text-lg font-bold">With sub menus</NText>
      <NMenu trigger={<NButton variant="outline">Open Menu</NButton>}>
        <NMenuItem title="New File" icon={<Ionicons name="document-outline" size={16} />} onPress={() => {}} />
        <NMenuItem title="Open" icon={<Ionicons name="folder-open-outline" size={16} />} onPress={() => {}} />
        <NSubMenu label="Share" icon={<Ionicons name="share-outline" size={16} />}>
          <NMenuItem title="Email" icon={<Ionicons name="mail-outline" size={16} />} onPress={() => {}} />
          <NMenuItem title="Message" icon={<Ionicons name="chatbubble-outline" size={16} />} onPress={() => {}} />
          <NMenuItem title="AirDrop" icon={<Ionicons name="wifi-outline" size={16} />} onPress={() => {}} />
        </NSubMenu>
        <NSubMenu label="Export As" icon={<Ionicons name="download-outline" size={16} />}>
          <NMenuItem title="PDF" icon={<Ionicons name="document-text-outline" size={16} />} onPress={() => {}} />
          <NMenuItem title="PNG" icon={<Ionicons name="image-outline" size={16} />} onPress={() => {}} />
          <NMenuItem title="SVG" icon={<Ionicons name="code-outline" size={16} />} onPress={() => {}} />
        </NSubMenu>
      </NMenu>

      <NText className="text-lg font-bold">With separators</NText>
      <NMenu trigger={<NButton variant="outline">File Menu</NButton>}>
        <NMenuItem title="New" icon={<Ionicons name="add-circle-outline" size={16} />} onPress={() => {}} />
        <NMenuItem title="Open" icon={<Ionicons name="folder-open-outline" size={16} />} onPress={() => {}} />
        <NMenuItem title="Save" icon={<Ionicons name="save-outline" size={16} />} onPress={() => {}} hasSeparator />
        <NMenuItem title="Delete" icon={<Ionicons name="trash-outline" size={16} />} onPress={() => {}} />
      </NMenu>

      <NText className="text-lg font-bold">With disabled item</NText>
      <NMenu trigger={<NButton variant="outline">Options</NButton>}>
        <NMenuItem title="Available" icon={<Ionicons name="checkmark-circle-outline" size={16} />} onPress={() => {}} />
        <NMenuItem title="Locked" icon={<Ionicons name="lock-closed-outline" size={16} />} onPress={() => {}} isDisabled />
      </NMenu>

      <NText className="text-lg font-bold">With shortcuts</NText>
      <NMenu trigger={<NButton variant="outline">Edit</NButton>}>
        <NMenuItem title="Cut" icon={<Ionicons name="cut-outline" size={16} />} shortcut="⌘X" onPress={() => {}} />
        <NMenuItem title="Copy" icon={<Ionicons name="copy-outline" size={16} />} shortcut="⌘C" onPress={() => {}} />
        <NMenuItem title="Paste" icon={<Ionicons name="clipboard-outline" size={16} />} shortcut="⌘V" onPress={() => {}} />
      </NMenu>
    </View>
  );
}`;

export const popoverCode = `import { View } from 'react-native';
import { NButton, NPopover, NText } from '@nayan-ui/native';

export default function PopoverScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Default (bottom)</NText>
      <NPopover trigger={<NButton variant="outline">Open Popover</NButton>}>
        <View className="p-3">
          <NText>Popover content below the trigger.</NText>
        </View>
      </NPopover>

      <NText className="text-lg font-bold">Placement top</NText>
      <NPopover placement="top" trigger={<NButton variant="outline">Top</NButton>}>
        <View className="p-3">
          <NText>Above the trigger.</NText>
        </View>
      </NPopover>

      <NText className="text-lg font-bold">Placement left</NText>
      <NPopover placement="left" trigger={<NButton variant="outline">Left</NButton>}>
        <View className="p-3">
          <NText>Left side.</NText>
        </View>
      </NPopover>

      <NText className="text-lg font-bold">Placement right</NText>
      <NPopover placement="right" trigger={<NButton variant="outline">Right</NButton>}>
        <View className="p-3">
          <NText>Right side.</NText>
        </View>
      </NPopover>

      <NText className="text-lg font-bold">Rich content</NText>
      <NPopover trigger={<NButton>Details</NButton>}>
        <View className="p-3 gap-2">
          <NText className="font-bold">User Info</NText>
          <NText className="text-muted">john@example.com</NText>
          <NButton size="sm" onPress={() => {}}>
            View Profile
          </NButton>
        </View>
      </NPopover>
    </View>
  );
}`;

export const progressCode = `import { View } from 'react-native';
import { useEffect, useState } from 'react';
import { NProgress, NText } from '@nayan-ui/native';

export default function ProgressScreen() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setValue(v => (v >= 100 ? 0 : v + 5));
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Animated</NText>
      <NProgress value={value} />
      <NText className="text-muted">{value}%</NText>

      <NText className="text-lg font-bold">Static values</NText>
      <NProgress value={0} />
      <NProgress value={25} />
      <NProgress value={50} />
      <NProgress value={75} />
      <NProgress value={100} />
    </View>
  );
}`;

export const radioGroupCode = `import { View } from 'react-native';
import { useState } from 'react';
import { NRadio, NText } from '@nayan-ui/native';

export default function RadioScreen() {
  const [fruit, setFruit] = useState('apple');
  const [size, setSize] = useState('md');

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NRadio
        label="Favorite fruit"
        value={fruit}
        onValueChange={setFruit}
        items={[
          { label: 'Apple', value: 'apple' },
          { label: 'Banana', value: 'banana' },
          { label: 'Cherry', value: 'cherry' },
          { label: 'Date', value: 'date' }
        ]}
      />
      <NText>Selected: {fruit}</NText>

      <NText className="text-lg font-bold">Size selection</NText>
      <NRadio
        label="Size"
        value={size}
        onValueChange={setSize}
        items={[
          { label: 'Small', value: 'sm' },
          { label: 'Medium', value: 'md' },
          { label: 'Large', value: 'lg' }
        ]}
      />

      <NText className="text-lg font-bold">Disabled</NText>
      <NRadio
        isDisabled
        value="a"
        onValueChange={() => {}}
        items={[
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' }
        ]}
      />
    </View>
  );
}`;

export const selectCode = `import { View } from 'react-native';
import { useState } from 'react';
import { NSelect, NText } from '@nayan-ui/native';

export default function SelectScreen() {
  const [country, setCountry] = useState('');

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NSelect
        label="Country"
        placeholder="Select a country"
        items={[
          { label: 'India', value: 'in' },
          { label: 'USA', value: 'us' },
          { label: 'UK', value: 'uk' },
          { label: 'Germany', value: 'de' },
          { label: 'Japan', value: 'jp' }
        ]}
        onValueChange={setCountry}
      />
      <NText>Selected: {country || '—'}</NText>

      <NText className="text-lg font-bold">With default value</NText>
      <NSelect
        label="Language"
        defaultValue={{ label: 'English', value: 'en' }}
        items={[
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' }
        ]}
        onValueChange={() => {}}
      />

      <NText className="text-lg font-bold">Disabled</NText>
      <NSelect label="Locked" isDisabled items={[{ label: 'Only option', value: 'only' }]} onValueChange={() => {}} />
    </View>
  );
}`;

export const sheetCode = `import { useState } from 'react';
import { View } from 'react-native';
import { NButton, NSheet, NText } from '@nayan-ui/native';

export default function SheetScreen() {
  const [basic, setBasic] = useState(false);
  const [content, setContent] = useState(false);

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NButton onPress={() => setBasic(true)}>Open Sheet</NButton>
      <NSheet isOpen={basic} onOpenChange={setBasic}>
        <View className="p-4">
          <NText className="text-lg font-bold mb-2">Bottom Sheet</NText>
          <NText>Simple sheet content.</NText>
          <NButton className="mt-4" variant="outline" onPress={() => setBasic(false)}>
            Close
          </NButton>
        </View>
      </NSheet>

      <NText className="text-lg font-bold">Rich content</NText>
      <NButton variant="outline" onPress={() => setContent(true)}>
        Open Rich Sheet
      </NButton>
      <NSheet isOpen={content} onOpenChange={setContent}>
        <View className="p-4 gap-3">
          <NText className="text-xl font-bold">Settings</NText>
          <NText className="text-muted">Adjust your preferences below.</NText>
          <NButton onPress={() => setContent(false)}>Save</NButton>
          <NButton variant="ghost" onPress={() => setContent(false)}>
            Cancel
          </NButton>
        </View>
      </NSheet>
    </View>
  );
}`;

export const skeletonCode = `import { View } from 'react-native';
import { NSkeleton, NSkeletonGroup, NText } from '@nayan-ui/native';

export default function SkeletonScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NSkeleton className="h-10 w-full rounded" isLoading />
      <NSkeleton className="h-10 w-3/4 rounded" isLoading />
      <NSkeleton className="h-10 w-1/2 rounded" isLoading />

      <NText className="text-lg font-bold">Shimmer variant</NText>
      <NSkeleton className="h-20 w-full rounded-lg" isLoading variant="shimmer" />

      <NText className="text-lg font-bold">Pulse variant</NText>
      <NSkeleton className="h-20 w-full rounded-lg" isLoading variant="pulse" />

      <NText className="text-lg font-bold">Card skeleton</NText>
      <View className="gap-2">
        <NSkeleton className="h-40 w-full rounded-lg" isLoading />
        <NSkeleton className="h-4 w-2/3 rounded" isLoading />
        <NSkeleton className="h-4 w-1/3 rounded" isLoading />
      </View>

      <NText className="text-lg font-bold">NSkeletonGroup</NText>
      <NSkeletonGroup isLoading>
        <View className="flex-row gap-3 items-center">
          <NSkeleton className="h-12 w-12 rounded-full" />
          <View className="flex-1 gap-2">
            <NSkeleton className="h-4 w-3/4 rounded" />
            <NSkeleton className="h-3 w-1/2 rounded" />
          </View>
        </View>
      </NSkeletonGroup>

      <NText className="text-lg font-bold">Not loading</NText>
      <NSkeleton className="h-10 w-full rounded" isLoading={false}>
        <NText>Content loaded!</NText>
      </NSkeleton>
    </View>
  );
}`;

export const sliderCode = `import { View } from 'react-native';
import { NSlider, NText } from '@nayan-ui/native';

export default function SliderScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NSlider defaultValue={50} />

      <NText className="text-lg font-bold">With output label</NText>
      <NSlider defaultValue={30} showOutput />

      <NText className="text-lg font-bold">Custom range (0–200)</NText>
      <NSlider defaultValue={100} minValue={0} maxValue={200} showOutput />

      <NText className="text-lg font-bold">Step = 10</NText>
      <NSlider defaultValue={50} step={10} showOutput />

      <NText className="text-lg font-bold">Disabled</NText>
      <NSlider defaultValue={40} isDisabled />
    </View>
  );
}`;

export const switchCode = `import { View } from 'react-native';
import { useState } from 'react';
import { NSwitch, NText } from '@nayan-ui/native';

export default function SwitchScreen() {
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NSwitch label="Wi-Fi" isSelected={wifi} onSelectedChange={setWifi} />
      <NSwitch label="Bluetooth" isSelected={bluetooth} onSelectedChange={setBluetooth} />
      <NText className="text-muted">
        Wi-Fi: {wifi ? 'On' : 'Off'}, Bluetooth: {bluetooth ? 'On' : 'Off'}
      </NText>

      <NText className="text-lg font-bold">Disabled</NText>
      <NSwitch label="Disabled on" isSelected isDisabled onSelectedChange={() => {}} />
      <NSwitch label="Disabled off" isSelected={false} isDisabled onSelectedChange={() => {}} />
    </View>
  );
}`;

export const tabsCode = `import { View } from 'react-native';
import { NTabs, NText } from '@nayan-ui/native';

export default function TabsScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic (uncontrolled)</NText>
      <NTabs
        defaultValue="account"
        items={[
          { label: 'Account', value: 'account', content: <NText>Manage your account settings.</NText> },
          { label: 'Security', value: 'security', content: <NText>Password and 2FA.</NText> },
          { label: 'Billing', value: 'billing', content: <NText>Payment methods and invoices.</NText> }
        ]}
      />

      <NText className="text-lg font-bold">Secondary variant</NText>
      <NTabs
        variant="secondary"
        defaultValue="tab1"
        items={[
          { label: 'Overview', value: 'tab1', content: <NText>Overview content.</NText> },
          { label: 'Analytics', value: 'tab2', content: <NText>Analytics data.</NText> },
          { label: 'Reports', value: 'tab3', content: <NText>Reports list.</NText> }
        ]}
      />

      <NText className="text-lg font-bold">With disabled tab</NText>
      <NTabs
        defaultValue="a"
        items={[
          { label: 'Active', value: 'a', content: <NText>This tab is active.</NText> },
          { label: 'Disabled', value: 'b', content: <NText>Cannot reach.</NText>, isDisabled: true },
          { label: 'Another', value: 'c', content: <NText>Another tab.</NText> }
        ]}
      />
    </View>
  );
}`;

export const textareaCode = `import { View } from 'react-native';
import { NInput, NText } from '@nayan-ui/native';

export default function InputScreen() {
  return (
    <View className="p-4 gap-1">
      <NText className="text-lg font-bold">Basic</NText>
      <NInput label="Name" />

      <NText className="text-lg font-bold">With description</NText>
      <NInput label="Email" description="We'll never share your email." />

      <NText className="text-lg font-bold">Required</NText>
      <NInput label="Username" isRequired />

      <NText className="text-lg font-bold">Invalid with error</NText>
      <NInput label="Password" isInvalid errorMessage="Password must be at least 8 characters." />

      <NText className="text-lg font-bold">Disabled</NText>
      <NInput label="Organization" isDisabled />

      <NText className="text-lg font-bold">Multiline (textarea)</NText>
      <NInput label="Bio" multiline description="Tell us about yourself." />

      <NText className="text-lg font-bold">All combined</NText>
      <NInput label="Phone" description="Include country code." isRequired isInvalid errorMessage="Invalid phone number." />
    </View>
  );
}`;

export const toastCode = `import { View } from 'react-native';
import { NButton, NText, useNToast } from '@nayan-ui/native';

export default function ToastScreen() {
  const toast = useNToast();

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Shorthand methods</NText>
      <NButton onPress={() => toast.success('Changes saved successfully!')}>Success</NButton>
      <NButton variant="danger" onPress={() => toast.error('Something went wrong.')}>
        Error
      </NButton>
      <NButton variant="outline" onPress={() => toast.info('New update available.')}>
        Info
      </NButton>
      <NButton variant="ghost" onPress={() => toast.warning('Low disk space.')}>
        Warning
      </NButton>

      <NText className="text-lg font-bold">With custom title</NText>
      <NButton variant="outline" onPress={() => toast.success('Your profile has been updated.', 'Profile')}>
        Success with title
      </NButton>
      <NButton variant="outline" onPress={() => toast.error('Please check your connection.', 'Network')}>
        Error with title
      </NButton>

      <NText className="text-lg font-bold">With action button</NText>
      <NButton
        variant="outline"
        onPress={() =>
          toast.show({
            type: 'success',
            title: 'Item deleted',
            message: 'The item has been moved to trash.',
            actionLabel: 'Undo',
            onActionPress: () => toast.info('Undo successful!')
          })
        }>
        With Action
      </NButton>
      <NButton
        variant="outline"
        onPress={() =>
          toast.show({
            type: 'warning',
            title: 'Session expiring',
            message: 'Your session will expire in 5 minutes.',
            actionLabel: 'Extend',
            onActionPress: () => toast.success('Session extended!')
          })
        }>
        Warning with Action
      </NButton>

      <NText className="text-lg font-bold">Generic show()</NText>
      <NButton variant="outline" onPress={() => toast.show({ type: 'info', title: 'Custom', message: 'Using toast.show() directly.' })}>
        toast.show()
      </NButton>
    </View>
  );
}`;

export const tooltipCode = `import { View } from 'react-native';
import { NButton, NText, NTooltip } from '@nayan-ui/native';

export default function TooltipScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NTooltip message="This is a tooltip">
        <NButton variant="outline">Hover / Press</NButton>
      </NTooltip>

      <NText className="text-lg font-bold">On different elements</NText>
      <NTooltip message="Button tooltip">
        <NButton>Primary button</NButton>
      </NTooltip>

      <NTooltip message="Ghost tooltip">
        <NButton variant="ghost">Ghost button</NButton>
      </NTooltip>

      <NText className="text-lg font-bold">Long message</NText>
      <NTooltip message="This is a longer tooltip message that provides more context about the element it's attached to.">
        <NButton variant="outline">More info</NButton>
      </NTooltip>
    </View>
  );
}`;
