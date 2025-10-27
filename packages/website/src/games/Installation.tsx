import { useLocation } from 'react-router-dom';
import { NLink } from '@nayan-ui/react';
import {
  advancedUsageCode,
  availableGamesCode,
  gameSettingsInterfaceCode,
  installCode,
  installYarnCode,
  peerDepsCode,
  simpleUsageCode
} from '@/services/GamesCodeBlocks';
import { getMenuItem } from '@/services/Utils';
import Code from '../helpers/Code';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';

const GamesInstallation = () => {
  const location = useLocation();
  const component: any = getMenuItem(location.pathname);

  return (
    <Sidebar title={component?.title || 'Installation'}>
      <Meta
        title="Installation - React Native Games"
        description="Installation guide for react-native-games library including peer dependencies and platform setup."
        keywords="react native games installation, setup, peer dependencies"
      />

      {/* Installation Section */}
      <div className="bg-card border border-border rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
          <span className="mr-3">📦</span>
          Installation
        </h2>
        <div className="space-y-4">
          <div className="bg-background rounded-lg p-4">
            <Code language="bash" code={installCode} />
            <p className="text-muted text-sm mt-2 text-center">or</p>
            <Code language="bash" code={installYarnCode} />
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Peer Dependencies</h3>
            <p className="text-muted text-sm mb-3">This library requires the following peer dependencies to be installed in your project:</p>
            <Code language="bash" code={peerDepsCode} />
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Platform Setup</h3>
            <p className="text-muted text-sm mb-3">Follow the installation guides for each peer dependency:</p>
            <ul className="text-muted text-sm space-y-2">
              <li>
                •{' '}
                <NLink
                  href="https://shopify.github.io/react-native-skia/docs/getting-started/installation"
                  target="_blank"
                  className="text-primary hover:underline">
                  @shopify/react-native-skia
                </NLink>{' '}
                - Graphics
              </li>
              <li>
                •{' '}
                <NLink
                  href="https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started"
                  target="_blank"
                  className="text-primary hover:underline">
                  react-native-reanimated
                </NLink>{' '}
                - Animations
              </li>
              <li>
                •{' '}
                <NLink
                  href="https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation"
                  target="_blank"
                  className="text-primary hover:underline">
                  react-native-gesture-handler
                </NLink>{' '}
                - Gestures
              </li>
              <li>
                •{' '}
                <NLink href="https://docs.expo.dev/versions/latest/sdk/speech/" target="_blank" className="text-primary hover:underline">
                  expo-speech
                </NLink>{' '}
                - Sounds
              </li>
              <li>
                •{' '}
                <NLink href="https://docs.expo.dev/versions/latest/sdk/haptics/" target="_blank" className="text-primary hover:underline">
                  expo-haptics
                </NLink>{' '}
                - Haptics
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Section */}
      <div className="bg-card border border-border rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
          <span className="mr-3">🚀</span>
          Usage
        </h2>
        <div className="space-y-6">
          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Simple Implementation</h3>
            <p className="text-muted text-sm mb-3">For basic usage without settings persistence:</p>
            <Code code={simpleUsageCode} />
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Advanced Implementation Example</h3>
            <p className="text-muted text-sm mb-3">
              All games use the same props pattern for consistency. Here's a complete example with settings persistence and navigation integration:
            </p>
            <Code code={advancedUsageCode} />
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Available Games</h3>
            <p className="text-muted text-sm mb-3">All games use the same props interface:</p>
            <Code code={availableGamesCode} />
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Game Settings & Configuration</h3>
            <p className="text-muted text-sm mb-3">All games use the unified GameSettings interface:</p>
            <Code code={gameSettingsInterfaceCode} />
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Game Settings</h3>
            <p className="text-muted text-sm mb-3">Each game includes built-in settings screens with a unified, simplified interface:</p>
            <ul className="text-muted text-sm space-y-2">
              <li>
                • <strong>Difficulty Levels</strong>: Easy, Medium, Hard - each game has custom difficulty descriptions and behaviors
              </li>
              <li>
                • <strong>Sound Effects</strong>: Toggle audio feedback on/off
              </li>
              <li>
                • <strong>Haptic Feedback</strong>: Toggle vibration feedback on/off
              </li>
            </ul>
            <p className="text-muted text-sm mt-3">
              All games use a centralized settings system for consistency and ease of maintenance. Game durations and difficulty behaviors are
              customized per game for optimal gameplay experience.
            </p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesInstallation;
