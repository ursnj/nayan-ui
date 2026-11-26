import { Landing } from '@nayan-ui/shared';
import { starterTheme } from '@nayan-ui/shared/theme';
import { registerRootComponent } from 'expo';
import { NTheme } from 'nayan-ui/components';

function App() {
  return (
    <NTheme {...starterTheme}>
      <Landing />
    </NTheme>
  );
}

registerRootComponent(App);
