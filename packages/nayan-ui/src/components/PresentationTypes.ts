import type { PropsWithChildren, ReactNode } from 'react';

export interface PresentationHostProps extends PropsWithChildren {
  sheet: boolean;
  height: number;
  /** Native chrome is outside the Rust content measurement. */
  bottomInset?: number;
  handleColor?: string;
  swipeable?: boolean;
  /** Unconditional header drag region; body dragging also works at the Rust scroll boundary. */
  dragAreaHeight?: number;
  dismissible?: boolean;
  ready?: boolean;
  width: number;
  border: string;
  background: string;
  onClose: () => void;
  backdrop?: ReactNode;
}
