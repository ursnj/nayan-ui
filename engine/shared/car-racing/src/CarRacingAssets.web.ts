import type { AssetSources } from '@nayan-engine-example/shared/car-racing';
import asphalt from '@nayan-engine-example/shared/car-racing/assets/textures/asphalt.png?url';
import grass from '@nayan-engine-example/shared/car-racing/assets/textures/grass.png?url';
import engine from '@nayan-engine-example/shared/car-racing/assets/sfx/engine.wav?url';
import point from '@nayan-engine-example/shared/car-racing/assets/sfx/point.wav?url';
import hit from '@nayan-engine-example/shared/car-racing/assets/sfx/hit.wav?url';
import win from '@nayan-engine-example/shared/car-racing/assets/sfx/win.wav?url';
import die from '@nayan-engine-example/shared/car-racing/assets/sfx/die.wav?url';

// The browser loads assets from URLs (Vite emits them with the build).
export const sources: AssetSources = {
  textures: { asphalt, grass },
  sounds: { engine, point, hit, win, die }
};
