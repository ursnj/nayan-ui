import { act, type ReactNode, useContext, useEffect } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import { PresentationGestureContext } from '../theme/contexts';

mock.module('../NPlatformView', () => ({ NPlatformView: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
mock.module('../NToastHost', () => ({ NToastHost: () => null }));
const dom = installDom();
// Gesture policy is tested synchronously; native browser animation timing is separate.
Object.defineProperty(dom.window.HTMLElement.prototype, 'animate', { configurable: true, value: undefined });
const elementDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Element');
Object.defineProperty(globalThis, 'Element', { configurable: true, value: dom.window.Element });
const { createRoot } = await import('react-dom/client');
const { PresentationHost } = await import('../PresentationHost.web');
afterAll(() => {
  dom.cleanup();
  if (elementDescriptor) Object.defineProperty(globalThis, 'Element', elementDescriptor);
  else Reflect.deleteProperty(globalThis, 'Element');
});

test('web sheets dismiss from unscrolled content while preserving scrolling, editing, direction and cancellation', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const close = mock(() => {});
  const cancel = mock(() => {});
  let atTop = false;
  function Content() {
    const presentation = useContext(PresentationGestureContext);
    useEffect(() => presentation?.register(cancel, () => atTop), [presentation]);
    return (
      <div data-content>
        <button>Action</button>
        <input aria-label="Name" />
      </div>
    );
  }
  try {
    await act(() =>
      root.render(
        <PresentationHost sheet swipeable height={600} width={400} border="#444" background="#222" onClose={close}>
          <Content />
        </PresentationHost>
      )
    );
    const panel = container.querySelector<HTMLElement>('[data-nayan-presentation]')!;
    panel.setPointerCapture = () => {};
    const content = container.querySelector<HTMLElement>('[data-content]')!;
    const pointer = (type: string, y: number, x = 100, target: HTMLElement = content, isPrimary = true) => {
      target.dispatchEvent(
        new window.PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, button: 0, isPrimary })
      );
    };
    pointer('pointerdown', 300);
    pointer('pointermove', 450);
    pointer('pointerup', 450);
    expect(close).not.toHaveBeenCalled();
    atTop = true;
    pointer('pointerdown', 300);
    pointer('pointermove', 240);
    pointer('pointermove', 450);
    pointer('pointerup', 450);
    expect(close).not.toHaveBeenCalled();
    pointer('pointerdown', 300);
    pointer('pointermove', 350, 200);
    pointer('pointermove', 450);
    pointer('pointerup', 450);
    expect(close).not.toHaveBeenCalled();
    const input = container.querySelector('input')!;
    pointer('pointerdown', 300, 100, input);
    pointer('pointermove', 450, 100, input);
    pointer('pointerup', 450, 100, input);
    expect(close).not.toHaveBeenCalled();
    pointer('pointerdown', 300);
    pointer('pointermove', 450);
    pointer('pointercancel', 450);
    pointer('pointerup', 450);
    expect(close).not.toHaveBeenCalled();
    expect(panel.style.transform).toBe('');
    pointer('pointerdown', 300);
    pointer('pointermove', 450);
    pointer('pointerdown', 450, 110, content, false);
    pointer('pointerup', 450);
    expect(close).not.toHaveBeenCalled();
    cancel.mockClear();
    pointer('pointerdown', 300);
    pointer('pointermove', 450);
    pointer('pointerup', 450);
    expect(close).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => root.unmount());
    container.remove();
  }
});
