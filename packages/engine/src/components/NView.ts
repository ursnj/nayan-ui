'use client';

import { type ComponentPropsWithRef, type ComponentRef, createElement, type JSX, type ReactElement, type Ref, useContext, useId, useImperativeHandle } from 'react';
import type { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { component } from './component';
import { ViewHost } from './PlatformHost';
import { ComponentRuntimeContext } from './runtime';
import { ComponentRenderContext } from './ThemeContext';
import type { ComponentProps } from './types';
const Host = component<ComponentProps>('NView');

export interface NViewRef {
  captureImage(uri: string, screen: { width: number; height: number }): Promise<{ base64: string; width: number; height: number }>;
}

/** Native measurement/SDK refs point directly to the underlying platform view. */
export type NViewNativeRef = ComponentRef<typeof View>;
export type NViewProps = Omit<ComponentProps, 'style' | 'onClick' | 'onKeyDown'> &
  Omit<ViewProps, keyof ComponentProps | 'ref' | 'onKeyDown'> & {
    style?: ComponentProps['style'] | StyleProp<ViewStyle>;
    onClick?: React.MouseEventHandler<HTMLElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
    onCancel?: React.ReactEventHandler<HTMLElement>;
    popover?: 'auto' | 'manual' | 'hint';
    onBeforeToggle?: React.ToggleEventHandler<HTMLDivElement>;
    onToggle?: React.ToggleEventHandler<HTMLDivElement>;
    ref?: Ref<NViewRef> | Ref<NViewNativeRef> | Ref<HTMLElement>;
  };

type TaggedViewProps<Tag extends keyof JSX.IntrinsicElements> = Omit<
  NViewProps,
  keyof ComponentPropsWithRef<Tag> | 'tag'
> &
  Omit<ComponentPropsWithRef<Tag>, 'onSubmit'> &
  Pick<NViewProps, 'onSubmit'> & { tag: Tag };

/** Rust layout inside ComponentsRoot; a platform view with optional semantic browser markup. */
export function NView<Tag extends keyof JSX.IntrinsicElements>(props: TaggedViewProps<Tag>): ReactElement;
export function NView(props: NViewProps): ReactElement;
export function NView({ entrance, ...props }: NViewProps | TaggedViewProps<keyof JSX.IntrinsicElements>) {
  const view = props as NViewProps;
  return useContext(ComponentRenderContext) ? createElement(EngineView, { ...view, entrance }) : createElement(ViewHost, view);
}

function EngineView({ ref, id, ...props }: NViewProps) {
  const generated = useId();
  const key = id ?? generated;
  const runtime = useContext(ComponentRuntimeContext);

  useImperativeHandle(
    ref as Ref<NViewRef>,
    () => ({
      captureImage: (uri, screen) => {
        if (!runtime?.captureNode) throw new Error('NView capture requires an engine surface');
        return runtime.captureNode(key, uri, screen);
      }
    }),
    [runtime, key]
  );

  return createElement(Host, { ...props, id: key } as ComponentProps);
}
