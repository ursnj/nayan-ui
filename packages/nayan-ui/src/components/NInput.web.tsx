'use client';

import type { InputHTMLAttributes, ReactElement } from 'react';
import { component } from './component';
import { NPlatformView } from './NPlatformView';
import type { ComponentInputProps } from './types';

type FileInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { type: 'file' };
export type NInputProps = (ComponentInputProps & { type?: Exclude<string, 'file'> }) | FileInputProps;
const Input = /* @__PURE__ */ component<ComponentInputProps>('NInput');

/** OS file selection remains a browser attachment, positioned and clipped by Rust. */
export function NInput(props: FileInputProps): ReactElement;
export function NInput(props: ComponentInputProps): ReactElement;
export function NInput(props: NInputProps): ReactElement {
  if (props.type !== 'file') return <Input {...(props as ComponentInputProps)} />;
  const { className, ...file } = props as FileInputProps;
  const hidden = className?.split(/\s+/).includes('sr-only');
  return (
    <NPlatformView
      className={hidden ? 'absolute inset-0' : className}
      style={hidden ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : { minHeight: 44, width: '100%' }}>
      <input
        {...file}
        type="file"
        style={{ width: '100%', height: hidden ? '100%' : undefined, opacity: hidden ? 0 : undefined, cursor: 'pointer', ...file.style }}
      />
    </NPlatformView>
  );
}
