import { Landing } from '@nayan-example/shared';
import { NPlatformView, NTheme } from 'nayan-ui/components';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <NTheme defaultTheme="system" surface={false}>
    <NPlatformView>
      <Landing />
    </NPlatformView>
  </NTheme>
);
