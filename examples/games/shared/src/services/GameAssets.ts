// What the game loader (GameAssetLoader) prepares before a game mounts, a few jobs per frame behind the
// loading screen, so no single long job freezes it (Android's Hermes stalls far longer than desktop
// JavaScript suggests). Trimmed from the games library's GameAssets.ts to Car Racing.
import { isEngineAvailable, warmUpEngine } from '@nayan-ui/engine';
import { warmAssets as warmCarRacing } from '../games/car-racing/CarRacingConstants';
import { warmAssets as warmCarRacingScene } from '../games/car-racing/CarRacingScene';
import { loadHudFonts, warmAssets as warmHud } from '../games/shared/EngineHud';
import type { AssetStage, AssetTask } from './GameAssetLoader';
import { GAME_IDS, type GameThemeMode } from './UtilsService';

const GAME_ASSETS: Record<GAME_IDS, () => Iterable<AssetTask>> = {
  [GAME_IDS.CAR_RACING]: function* () {
    yield* warmCarRacing();
    yield* warmCarRacingScene();
  }
};

const prepared = new Set<GAME_IDS>();
let sharedReady = false;

/** Whether a game's assets were prepared this session, so opening it again skips the loader. */
export const areGameAssetsReady = (id: GAME_IDS, _mode?: GameThemeMode): boolean => prepared.has(id);

/** The loader's stages for one game. Nothing here runs until its loading screen has painted. */
export function gameAssetStages(id: GAME_IDS, _mode?: GameThemeMode): AssetStage[] {
  return [
    {
      label: 'Getting ready',
      *tasks() {
        yield () => {
          if (!isEngineAvailable) throw Error('The native game engine is unavailable in this app build');
          return warmUpEngine();
        };
        if (!sharedReady) {
          yield loadHudFonts;
          yield* warmHud();
          yield () => {
            sharedReady = true;
          };
        }
      }
    },
    {
      label: 'Bringing your world to life',
      *tasks() {
        if (prepared.has(id)) return;
        yield* GAME_ASSETS[id]();
        yield () => {
          prepared.add(id);
        };
      }
    }
  ];
}
