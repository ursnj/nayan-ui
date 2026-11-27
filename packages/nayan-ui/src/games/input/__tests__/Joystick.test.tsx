import { act } from 'react';
import { afterAll, afterEach, expect, test } from 'bun:test';
import { installDom } from '../../../__tests__/dom';
import { Joystick, type JoystickState, useJoystick } from '../Joystick.web';

const dom = installDom();
const { createRoot } = await import('react-dom/client');
let root: ReturnType<typeof createRoot> | undefined;
let container: HTMLElement;
let state: JoystickState;
let pad: HTMLElement;
const identities: JoystickState[] = [];
function App() {
  state = useJoystick();
  identities.push(state);
  return <Joystick state={state} size={100} />;
}
async function mount() {
  if (!root) {
    container = document.createElement('div');
    root = createRoot(container);
  }
  await act(async () => root!.render(<App />));
  pad = container.firstElementChild as HTMLElement;
  pad.setPointerCapture = () => {};
}
function pointer(type: string, id: number, x = 0, y = 0, button = 0) {
  pad.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      pointerId: id,
      clientX: x,
      clientY: y,
      button
    })
  );
}
afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  identities.length = 0;
});
afterAll(() => dom.cleanup());

test('joystick clamps radially, uses upward Y and holds the same mutable state across renders', async () => {
  await mount();
  pointer('pointerdown', 1, 50, 50);
  pointer('pointermove', 1, 65, 35);
  expect(state).toEqual({ x: 0.5, y: 0.5 });
  pointer('pointermove', 1, 150, 150);
  expect(Math.hypot(state.x, state.y)).toBeCloseTo(1);
  expect(state.x).toBeCloseTo(Math.SQRT1_2);
  expect(state.y).toBeCloseTo(-Math.SQRT1_2);
  expect(pad.firstElementChild!.getAttribute('style')).toContain('translate(');
  await mount();
  expect(identities[0]).toBe(identities[1]);
  pointer('pointerup', 1);
  expect(state).toEqual({ x: 0, y: 0 });
  expect((pad.firstElementChild as HTMLElement).style.transform).toBe('translate(0px, 0px)');
});

test('unrelated pointers and non-primary mouse buttons cannot hijack a stick', async () => {
  await mount();
  pointer('pointerdown', 2, 0, 0, 2);
  pointer('pointermove', 2, 30);
  expect(state.x).toBe(0);
  pointer('pointerdown', 1);
  pointer('pointermove', 1, 15);
  pointer('pointerdown', 2, 100);
  pointer('pointermove', 2, 200);
  pointer('pointerup', 2);
  pointer('lostpointercapture', 2);
  expect(state.x).toBe(0.5);
  pointer('pointermove', 1, 30);
  expect(state.x).toBe(1);
});

test.each(['pointercancel', 'lostpointercapture', 'blur', 'hidden', 'unmount'])('%s clears movement immediately', async (reason) => {
  await mount();
  pointer('pointerdown', 1);
  pointer('pointermove', 1, 30);
  expect(state.x).toBe(1);
  if (reason === 'blur') window.dispatchEvent(new Event('blur'));
  else if (reason === 'hidden') {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true
    });
    document.dispatchEvent(new Event('visibilitychange'));
  } else if (reason === 'unmount') {
    await act(async () => root!.unmount());
    root = undefined;
  } else pointer(reason, 1);
  expect(state).toEqual({ x: 0, y: 0 });
});
