import { act, createContext, type ReactNode, useContext, useEffect } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import { SafeAreaInsetsContext } from '../safeAreaContext';
import { PageContext } from '../theme/contexts';
import { ComponentThemeContext } from '../ThemeContext';

function Box({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}

let measure: ((width: number, height: number) => void) | undefined;
let modalHeight = 0;
let pageIndicator: boolean | undefined;
let pageBackground: string | undefined;
let modalProps: {
  height: number;
  ready?: boolean;
  swipeable?: boolean;
  bottomInset?: number;
  dismissible?: boolean;
  onClose?: () => void;
  background?: string;
  backdrop?: ReactNode;
} = {
  height: 0
};
mock.module('../NPage', () => ({
  NPage: ({
    children,
    onContentSizeChange,
    showsVerticalScrollIndicator,
    background
  }: {
    children?: ReactNode;
    onContentSizeChange?: (width: number, height: number) => void;
    showsVerticalScrollIndicator?: boolean;
    background?: string;
  }) => {
    pageIndicator = showsVerticalScrollIndicator;
    pageBackground = background;
    measure = onContentSizeChange;
    return <Box>{children}</Box>;
  }
}));

mock.module('../NView', () => ({ NView: Box }));

mock.module('../NText', () => ({ NText: Box }));

mock.module('../NPress', () => ({
  NPress: ({ children, onPress, accessibilityLabel }: { children?: ReactNode; onPress?: () => void; accessibilityLabel?: string }) => (
    <button aria-label={accessibilityLabel} onClick={onPress}>
      {children}
    </button>
  )
}));

mock.module('../NButton', () => ({
  NButton: ({ children, onPress }: { children: ReactNode; onPress: () => void }) => <button onClick={onPress}>{children}</button>
}));

mock.module('../PresentationHost', () => ({
  PresentationHost: ({
    children,
    ...props
  }: {
    children?: ReactNode;
    height: number;
    ready?: boolean;
    swipeable?: boolean;
    bottomInset?: number;
  }) => {
    modalHeight = props.height;
    modalProps = props;
    return <Box>{children}</Box>;
  },
  usePresentationSize: () => ({ width: 390, height: 844 })
}));

const dom = installDom();
const { createRoot } = await import('react-dom/client');
const { NSheet, NConfirm } = await import('../NPresentation');

afterAll(() => dom.cleanup());

test('portalled dialogs retain the nearest registered service and engine safe-area context', async () => {
  const Session = createContext('outside');
  const contexts = [Session];
  const root = createRoot(document.createElement('div'));
  const outlet = document.createElement('div');
  const modalRoot = createRoot(outlet);
  let content: ReactNode = null;
  let mounts = 0;
  const page = {
    portal: (_id: string, element: ReactNode) => {
      content = element;
    }
  };
  function Consumer() {
    const session = useContext(Session);
    const insets = useContext(SafeAreaInsetsContext);
    useEffect(() => {
      mounts++;
    }, []);
    return (
      <span>
        {session}:{insets?.bottom}
      </span>
    );
  }
  try {
    for (const value of ['signed-in', 'signed-out']) {
      await act(() =>
        root.render(
          <ComponentThemeContext.Provider value={{ contexts }}>
            <PageContext.Provider value={page}>
              <SafeAreaInsetsContext.Provider value={{ top: 30, right: 0, bottom: 20, left: 0 }}>
                <Session.Provider value={value}>
                  <NSheet isOpen>
                    <Consumer />
                  </NSheet>
                </Session.Provider>
              </SafeAreaInsetsContext.Provider>
            </PageContext.Provider>
          </ComponentThemeContext.Provider>
        )
      );
      await act(() => modalRoot.render(content));
      expect(outlet.textContent).toContain(`${value}:20`);
    }
    expect(mounts).toBe(1);
  } finally {
    await act(() => root.unmount());
    await act(() => modalRoot.unmount());
  }
});

test('sheet chrome follows the resolved system palette', async () => {
  const root = createRoot(document.createElement('div'));
  try {
    for (const resolvedTheme of ['dark', 'light'] as const) {
      await act(() =>
        root.render(
          <ComponentThemeContext.Provider
            value={{
              theme: 'system',
              resolvedTheme,
              colors: { background: '#aaaaaa' },
              themes: { dark: { background: '#111111' }, light: { background: '#eeeeee' } }
            }}>
            <NSheet isOpen>Content</NSheet>
          </ComponentThemeContext.Provider>
        )
      );
      const background = resolvedTheme === 'dark' ? '#111111' : '#eeeeee';
      expect(modalProps.background).toBe(background);
      expect(pageBackground).toBe(background);
    }
  } finally {
    await act(() => root.unmount());
  }
});

test('blurred sheets expose the themed backdrop through a transparent host and canvas', async () => {
  const root = createRoot(document.createElement('div'));
  const Background = () => <div>Frosted panel</div>;
  const render = (blurred?: boolean) => (
    <ComponentThemeContext.Provider value={{ colors: { background: '#222222' }, presentationBackground: Background }}>
      <NSheet isOpen blurred={blurred}>
        Content
      </NSheet>
    </ComponentThemeContext.Provider>
  );
  try {
    await act(() => root.render(render(true)));
    expect(modalProps.background).toBe('transparent');
    expect(pageBackground).toBe('transparent');
    expect((modalProps.backdrop as { type: unknown }).type).toBe(Background);
    await act(() => root.render(render()));
    expect(modalProps.background).toBe('#222222');
    expect(pageBackground).toBe('#222222');
    expect(modalProps.backdrop).toBeUndefined();
  } finally {
    await act(() => root.unmount());
  }
});

test('sheet indicator opt-out reaches the page and leaves swipe dismissal enabled', async () => {
  const root = createRoot(document.createElement('div'));
  const changed = mock(() => {});
  try {
    await act(() =>
      root.render(
        <NSheet isOpen onOpenChange={changed} showsVerticalScrollIndicator={false}>
          Content
        </NSheet>
      )
    );
    expect(pageIndicator).toBe(false);
    expect(modalProps.swipeable).toBe(true);
    await act(() =>
      root.render(
        <NSheet isOpen onOpenChange={changed}>
          Content
        </NSheet>
      )
    );
    expect(pageIndicator).toBeUndefined();
  } finally {
    await act(() => root.unmount());
  }
});

test('hiding a sheet close button retains its title, swipe and host dismissal', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  const changed = mock(() => {});
  try {
    await act(() =>
      root.render(
        <NSheet isOpen title="Comments" showCloseButton={false} onOpenChange={changed}>
          Content
        </NSheet>
      )
    );
    expect(node.textContent).toContain('Comments');
    expect(node.querySelector('button[aria-label="Close"]')).toBeNull();
    expect(modalProps.swipeable).toBe(true);
    expect(modalProps.dismissible).toBe(true);
    await act(() => modalProps.onClose?.());
    expect(changed).toHaveBeenCalledWith(false);
    await act(() =>
      root.render(
        <NSheet isOpen title="Other sheet" onOpenChange={changed}>
          Content
        </NSheet>
      )
    );
    expect(node.querySelector('button[aria-label="Close"]')).not.toBeNull();
  } finally {
    await act(() => root.unmount());
  }
});

test('controlled sheets defer data subscriptions while closed and release them on dismissal', async () => {
  let mounts = 0;
  function Content() {
    useEffect(() => {
      mounts++;
      return () => {
        mounts--;
      };
    }, []);

    return null;
  }
  const root = createRoot(document.createElement('div'));
  try {
    await act(() =>
      root.render(
        <NSheet isOpen={false}>
          <Content />
        </NSheet>
      )
    );
    expect(mounts).toBe(0);
    await act(() =>
      root.render(
        <NSheet isOpen>
          <Content />
        </NSheet>
      )
    );
    expect(mounts).toBe(1);
    await act(() =>
      root.render(
        <NSheet isOpen={false}>
          <Content />
        </NSheet>
      )
    );
    expect(mounts).toBe(0);
  } finally {
    await act(() => root.unmount());
  }
});

test('confirmations report the selected result and close through their controlled callback', async () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  const result = mock(() => {});
  const changed = mock(() => {});
  try {
    await act(() => root.render(<NConfirm title="Delete?" isOpen onResult={result} onOpenChange={changed} />));
    await act(() => {
      (Array.from(node.querySelectorAll('button')).find((b) => b.textContent === 'Cancel') as HTMLButtonElement).click();
    });
    expect(result).toHaveBeenCalledWith(false);
    expect(changed).toHaveBeenCalledWith(false);
  } finally {
    await act(() => root.unmount());
  }
});

test('confirmation height follows Rust content measurements and stays within the screen', async () => {
  const root = createRoot(document.createElement('div'));
  try {
    await act(() => root.render(<NConfirm title="Log out?" description="Are you sure?" isOpen onResult={() => {}} />));
    expect(modalHeight).toBe(220);
    await act(() => measure?.(358, 184));
    expect(modalHeight).toBe(184);
    await act(() => measure?.(358, 1200));
    expect(modalHeight).toBeCloseTo(844 * 0.7);
  } finally {
    await act(() => root.unmount());
  }
});

test('sheets fit changing Rust content measurements, include safe area, and cap tall content', async () => {
  const root = createRoot(document.createElement('div'));
  try {
    await act(() =>
      root.render(
        <ComponentThemeContext.Provider value={{ presentationInsets: { top: 62, bottom: 34 } }}>
          <NSheet isOpen title="Actions" onOpenChange={() => {}}>
            Content
          </NSheet>
        </ComponentThemeContext.Provider>
      )
    );
    expect(modalProps.ready).toBe(false);
    expect(modalProps.swipeable).toBe(true);
    expect(modalProps.bottomInset).toBe(34);
    await act(() => measure?.(350, 180));
    expect(modalProps.ready).toBe(true);
    expect(modalHeight).toBe(180 + 32 + 34 + 1);
    await act(() => measure?.(350, 320));
    expect(modalHeight).toBe(320 + 32 + 34 + 1);
    await act(() => measure?.(350, 120));
    expect(modalHeight).toBe(120 + 32 + 34 + 1);
    await act(() => measure?.(350, 1600));
    expect(modalHeight).toBeCloseTo(844 * 0.9);
  } finally {
    await act(() => root.unmount());
  }
});

test('snap points cap content fitting and fixed sizing remains available explicitly', async () => {
  const root = createRoot(document.createElement('div'));
  try {
    await act(() =>
      root.render(
        <NSheet isOpen snapPoints={['80%']} onOpenChange={() => {}}>
          Content
        </NSheet>
      )
    );
    await act(() => measure?.(350, 100));
    expect(modalHeight).toBe(149);
    await act(() => measure?.(350, 1600));
    expect(modalHeight).toBeCloseTo(844 * 0.8);
    await act(() =>
      root.render(
        <NSheet isOpen fitContent={false} snapPoints={['80%']} onOpenChange={() => {}}>
          Content
        </NSheet>
      )
    );
    await act(() => measure?.(350, 100));
    expect(modalHeight).toBeCloseTo(844 * 0.8);
  } finally {
    await act(() => root.unmount());
  }
});

test('sheets remeasure each visit, ignore invalid measurements, and respect dismissal settings', async () => {
  const root = createRoot(document.createElement('div'));
  try {
    await act(() =>
      root.render(
        <NSheet isOpen isSwipeable={false} onOpenChange={() => {}}>
          Content
        </NSheet>
      )
    );
    expect(modalProps.swipeable).toBe(false);
    await act(() => measure?.(350, 100));
    expect(modalHeight).toBe(133);
    for (const invalid of [0, -1, NaN, Infinity]) {
      await act(() => measure?.(350, invalid));
      expect(modalHeight).toBe(133);
    }
    await act(() => root.render(<NSheet isOpen={false}>Content</NSheet>));
    await act(() => root.render(<NSheet isOpen>New content</NSheet>));
    expect(modalProps.ready).toBe(false);
    expect(modalProps.swipeable).toBe(false);
    await act(() => measure?.(350, 200));
    expect(modalHeight).toBe(233);
  } finally {
    await act(() => root.unmount());
  }
});

test('uncontrolled confirmation opens from its child and resolves only an explicit choice', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const pressed = mock(() => {});
  const result = mock((_confirmed: boolean) => {});
  const { NPress } = await import('../NPress');
  try {
    await act(() =>
      root.render(
        <NConfirm title="Delete artwork?" onResult={result}>
          <NPress accessibilityLabel="Delete" onPress={pressed}>
            Delete
          </NPress>
        </NConfirm>
      )
    );
    expect(container.textContent).not.toContain('Delete artwork?');
    await act(() => (container.querySelector('[aria-label="Delete"]') as HTMLButtonElement).click());
    expect(pressed).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Delete artwork?');
    expect(result).not.toHaveBeenCalled();
    await act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Cancel')!.click());
    expect(result).toHaveBeenLastCalledWith(false);
    expect(container.textContent).not.toContain('Delete artwork?');
    await act(() => (container.querySelector('[aria-label="Delete"]') as HTMLButtonElement).click());
    await act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Confirm')!.click());
    expect(result).toHaveBeenLastCalledWith(true);
    expect(result).toHaveBeenCalledTimes(2);
  } finally {
    await act(() => root.unmount());
  }
});

test('uncontrolled sheets support a trigger and native dismissal', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const { NPress } = await import('../NPress');
  try {
    await act(() => root.render(<NSheet trigger={<NPress accessibilityLabel="Open tools">Tools</NPress>}>Drawing tools</NSheet>));
    expect(container.textContent).not.toContain('Drawing tools');
    await act(() => (container.querySelector('button') as HTMLButtonElement).click());
    expect(container.textContent).toContain('Drawing tools');
    await act(() => modalProps.onClose?.());
    expect(container.textContent).not.toContain('Drawing tools');
  } finally {
    await act(() => root.unmount());
  }
});
