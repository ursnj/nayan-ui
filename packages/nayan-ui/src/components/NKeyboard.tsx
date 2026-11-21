'use client';

import { type ReactNode, useContext, useState, useSyncExternalStore } from 'react';
import { ComponentsRoot } from './ComponentsRoot';
import { dismissKeyboard, KeyboardHost, type KeyboardHostStyle } from './KeyboardHost';
import { KeyboardStore } from './keyboardStore';
import { NButton } from './NButton';
import { NText } from './NText';
import { NView } from './NView';
import { KeyboardContext } from './theme/contexts';
import { ComponentRenderContext } from './ThemeContext';

export interface NKeyboardProps {
  children: ReactNode;
  enabled?: boolean;
  /** Previous, Next and Done controls for engine inputs. Default: true on native. */
  toolbar?: boolean;
  /** Override the automatically measured screen/header offset, in points. */
  keyboardVerticalOffset?: number;
  doneLabel?: string;
  style?: KeyboardHostStyle;
}
export function useNKeyboard() {
  const controller = useContext(KeyboardContext);
  if (!controller) throw new Error('useNKeyboard requires an NKeyboard ancestor');
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getServerSnapshot);
  return { ...state, dismiss: controller.dismiss, focus: controller.focus, focusNext: controller.focusNext, focusPrevious: controller.focusPrevious };
}
function KeyboardToolbar({ label }: { label: string }) {
  const keyboard = useNKeyboard();
  if (!keyboard.visible || !keyboard.focusedInput) return null;
  return (
    <ComponentsRoot background="transparent" style={{ height: 48, minHeight: 48, flex: undefined }}>
      <NView className="bg-overlay border-separator h-12 w-full flex-row items-center gap-1 border-t px-2">
        <NButton
          className="h-11 w-11 rounded-lg bg-transparent p-0"
          accessibilityLabel="Previous field"
          disabled={!keyboard.hasPrevious}
          onPress={keyboard.focusPrevious}>
          <NText className="text-accent text-2xl">‹</NText>
        </NButton>
        <NButton
          className="h-11 w-11 rounded-lg bg-transparent p-0"
          accessibilityLabel="Next field"
          disabled={!keyboard.hasNext}
          onPress={keyboard.focusNext}>
          <NText className="text-accent text-2xl">›</NText>
        </NButton>
        <NView className="flex-1" />
        <NButton className="h-11 rounded-lg bg-transparent px-3" onPress={keyboard.dismiss}>
          <NText className="text-accent font-medium">{label}</NText>
        </NButton>
      </NView>
    </ComponentsRoot>
  );
}
function KeyboardRoot({ children, enabled = true, toolbar = true, keyboardVerticalOffset, doneLabel = 'Done', style }: NKeyboardProps) {
  const rendering = useContext(ComponentRenderContext);
  const [controller] = useState(() => new KeyboardStore(dismissKeyboard));
  if (rendering) throw new Error('NKeyboard must wrap NPage or ComponentsRoot, outside the engine-rendered tree');
  return (
    <KeyboardContext.Provider value={controller}>
      <KeyboardHost
        controller={controller}
        enabled={enabled}
        offset={keyboardVerticalOffset}
        style={style}
        toolbar={toolbar ? <KeyboardToolbar label={doneLabel} /> : null}>
        {children}
      </KeyboardHost>
    </KeyboardContext.Provider>
  );
}
/** A screen-scoped keyboard controller. Exported through the shared /ui entry. */
export const NKeyboard = /* @__PURE__ */ Object.assign(KeyboardRoot, { dismiss: dismissKeyboard });
