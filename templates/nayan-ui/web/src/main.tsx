import { Landing } from '@nayan-ui/shared';
import { starterTheme } from '@nayan-ui/shared/theme';
import { NPlatformView, NTheme, useNTheme } from 'nayan-ui/components';
import { createRoot } from 'react-dom/client';
import './generated-styles.css';

function BrowserScreen() {
  const { resolvedTheme } = useNTheme();

  return (
    <div data-theme={resolvedTheme} className="flex flex-1 flex-col leading-[normal] [&_button]:[font:revert]">
      <NPlatformView>
        <Landing />
      </NPlatformView>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <div className="flex min-h-dvh flex-col">
    <NTheme {...starterTheme} surface={false}>
      <BrowserScreen />
    </NTheme>
  </div>
);
