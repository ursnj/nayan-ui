import { memo, useCallback } from 'react';
import { processColor } from 'react-native';
import { EngineSurface } from './EngineSurface';
import type { DocumentSurfaceProps } from './types';

/** Native coalesced finger/Pencil/stylus input, with pinch zoom and pan, bypasses the JS thread. */
function renderDocumentSurface<Change>({
  document,
  mode = 'draw',
  background = '#ffffff',
  active = true,
  onChange,
  onError,
  style
}: DocumentSurfaceProps<Change>) {
  const color = processColor(background);
  const change = useCallback(
    (event: { nativeEvent: { state: string; documentId: number } }) => {
      if (!active || document.isDisposed || event.nativeEvent.documentId !== document.id) return;
      try {
        onChange?.(JSON.parse(event.nativeEvent.state));
      } catch (failure) {
        onError?.(failure instanceof Error ? failure : new Error(String(failure)));
      }
    },
    [onChange, onError, active, document]
  );
  return (
    <EngineSurface
      onDrawingChange={onChange ? change : undefined}
      surfaceId={document.id}
      drawingId={active ? document.id : -1}
      drawingMode={mode === 'components' ? 3 : mode === 'draw' ? 0 : mode === 'move' ? 1 : 2}
      drawingBackground={typeof color === 'number' ? color & 0xffffff : 0xffffff}
      style={{ flex: 1, ...style }}
    />
  );
}

export const DocumentSurface = memo(renderDocumentSurface) as typeof renderDocumentSurface;
