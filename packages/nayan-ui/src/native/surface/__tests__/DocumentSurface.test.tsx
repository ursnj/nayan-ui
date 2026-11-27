import { act } from 'react';
import { expect, mock, test } from 'bun:test';
import { installReactTestEnvironment } from '../../../__tests__/dom';

type DrawingEvent = { nativeEvent: { documentId: number; state: string } };
let onDrawingChange: ((event: DrawingEvent) => void) | undefined;

mock.module('react-native', () => ({
  Platform: { OS: 'android' },
  processColor: () => 0xffffff,
  requireNativeComponent: () => (props: { onDrawingChange?: (event: DrawingEvent) => void }) => {
    onDrawingChange = props.onDrawingChange;
    return null;
  }
}));

const { DocumentSurface } = await import('../DocumentSurface');

test('native component snapshots reach React while drawing events retain their original shape', async () => {
  const dom = await installReactTestEnvironment();
  const root = dom.createRoot(document.createElement('div'));
  const surface = {
    id: 7,
    isDisposed: false,
    input() {},
    cancel() {},
    transform() {},
    invalidateView() {},
    readChange: () => null,
    present() {}
  };
  const onChange = mock((_state: unknown) => {});
  const emit = (documentId: number, state: unknown) => {
    if (!onDrawingChange) throw new Error('Missing native event handler');
    onDrawingChange({ nativeEvent: { documentId, state: JSON.stringify(state) } });
  };

  try {
    await act(() => root.render(<DocumentSurface document={surface} mode="components" onChange={onChange} />));
    const snapshot = { revision: 1, nodes: [], events: [], imageRequests: [] };
    emit(8, { components: snapshot });
    expect(onChange).not.toHaveBeenCalled();
    emit(7, { components: snapshot });
    expect(onChange).toHaveBeenLastCalledWith({ ui: snapshot });

    await act(() => root.render(<DocumentSurface document={surface} mode="draw" onChange={onChange} />));
    const drawing = { revision: 2, strokeCount: 1 };
    emit(7, drawing);
    expect(onChange).toHaveBeenLastCalledWith(drawing);
  } finally {
    await act(() => root.unmount());
    dom.cleanup();
  }
});
