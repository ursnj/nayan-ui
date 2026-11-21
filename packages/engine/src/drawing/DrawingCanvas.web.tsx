import { DocumentSurface } from '../native/surface/DocumentSurface.web';
import type { DrawingCanvasProps } from './types';

export type { DrawingCanvasProps } from './types';

export const DrawingCanvas: (props: DrawingCanvasProps) => ReturnType<typeof DocumentSurface> = DocumentSurface;
