'use client';

import { usePathname } from 'next/navigation';
import { H3_DOC } from '@/design/system';
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
      <div className="mb-8">
        <div className="space-y-6">
          <div className="mb-6">
            <h3 className={H3_DOC}>Exported Constants & Types</h3>
            <Code code={exportedConstantsCode} />
          </div>

          <div className="mb-6">
            <h3 className={H3_DOC}>GAME_IDS Enum</h3>
            <p className="text-muted text-sm mb-3">All available game identifiers:</p>
            <Code code={gameIdsEnumCode} />
          </div>

          <div className="mb-6">
            <h3 className={H3_DOC}>DEFAULT_GAME_SETTINGS</h3>
            <p className="text-muted text-sm mb-3">Default configuration for all games:</p>
            <Code code={defaultGameSettingsCode} />
          </div>

          <div className="mb-6">
            <h3 className={H3_DOC}>GAMES_LIST</h3>
            <p className="text-muted text-sm mb-3">Array of all game definitions with metadata:</p>
            <Code code={gamesListCode} />
          </div>

          <div className="mb-6">
            <h3 className={H3_DOC}>GAMES_MAPPING</h3>
            <p className="text-muted text-sm mb-3">Object mapping game IDs to their components:</p>
            <Code code={gamesMappingCode} />
          </div>

          <div className="mb-6">
            <h3 className={H3_DOC}>TypeScript Types</h3>
            <Code code={typescriptTypesCode} />
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesApiReference;
