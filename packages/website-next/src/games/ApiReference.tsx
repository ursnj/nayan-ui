'use client';

import { usePathname } from 'next/navigation';
import Code from '@/helpers/Code';
import Sidebar from '@/helpers/Sidebar';
import {
  defaultGameSettingsCode,
  exportedConstantsCode,
  gameIdsEnumCode,
  gamesListCode,
  gamesMappingCode,
  typescriptTypesCode
} from '@/services/GamesCodeBlocks';
import { getMenuItem } from '@/services/Utils';

const GamesApiReference = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || 'API Reference'}>
      <Meta
        title="API Reference - React Native Games"
        description="Complete API reference for react-native-games library including exported constants, types, and components."
        keywords="react native games api, game ids, game settings, typescript types"
      />

      {/* API Reference Section */}
      <div className="mb-8">
        <div className="space-y-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Exported Constants & Types</h3>
            <Code code={exportedConstantsCode} />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">GAME_IDS Enum</h3>
            <p className="text-muted text-sm mb-3">All available game identifiers:</p>
            <Code code={gameIdsEnumCode} />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">DEFAULT_GAME_SETTINGS</h3>
            <p className="text-muted text-sm mb-3">Default configuration for all games:</p>
            <Code code={defaultGameSettingsCode} />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">GAMES_LIST</h3>
            <p className="text-muted text-sm mb-3">Array of all game definitions with metadata:</p>
            <Code code={gamesListCode} />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">GAMES_MAPPING</h3>
            <p className="text-muted text-sm mb-3">Object mapping game IDs to their components:</p>
            <Code code={gamesMappingCode} />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">TypeScript Types</h3>
            <Code code={typescriptTypesCode} />
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesApiReference;
