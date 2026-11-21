import type { DocumentSurface as Surface, DocumentSurfaceProps } from '../native/surface/types';
import type { DrawingState } from './DrawingDocument';

export type DrawingSurfaceDocument = Surface<DrawingState>;
export type DrawingCanvasProps = DocumentSurfaceProps<DrawingState>;
