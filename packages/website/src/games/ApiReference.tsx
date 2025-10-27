import { useLocation } from 'react-router-dom';
import {
  defaultGameSettingsCode,
  exportedConstantsCode,
  gameIdsEnumCode,
  gamesListCode,
  gamesMappingCode,
  typescriptTypesCode
} from '@/services/GamesCodeBlocks';
import { getMenuItem } from '@/services/Utils';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';

const GamesApiReference = () => {
  const location = useLocation();
  const component: any = getMenuItem(location.pathname);

  return (
    <Sidebar title={component?.title || 'API Reference'}>
      <Meta
        title="API Reference - React Native Games"
        description="Complete API reference for react-native-games library including exported constants, types, and components."
        keywords="react native games api, game ids, game settings, typescript types"
      />

      {/* API Reference Section */}
      <div className="bg-card border border-border rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
          <span className="mr-3">📚</span>
          API Reference
        </h2>
        <div className="space-y-6">
          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Exported Constants & Types</h3>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{exportedConstantsCode}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">GAME_IDS Enum</h3>
            <p className="text-muted text-sm mb-3">All available game identifiers:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{gameIdsEnumCode}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">DEFAULT_GAME_SETTINGS</h3>
            <p className="text-muted text-sm mb-3">Default configuration for all games:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{defaultGameSettingsCode}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">GAMES_LIST</h3>
            <p className="text-muted text-sm mb-3">Array of all game definitions with metadata:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{gamesListCode}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">GAMES_MAPPING</h3>
            <p className="text-muted text-sm mb-3">Object mapping game IDs to their components:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{gamesMappingCode}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">TypeScript Types</h3>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{typescriptTypesCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesApiReference;
