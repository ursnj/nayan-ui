import type { AssetSources } from '@nayan-engine-example/shared/car-racing';

// React Native bundles assets with Metro's require(...).
export const sources: AssetSources = {
  textures: {
    asphalt: require('@nayan-engine-example/shared/car-racing/assets/textures/asphalt.png'),
    grass: require('@nayan-engine-example/shared/car-racing/assets/textures/grass.png')
  },
  sounds: {
    engine: require('@nayan-engine-example/shared/car-racing/assets/sfx/engine.wav'),
    point: require('@nayan-engine-example/shared/car-racing/assets/sfx/point.wav'),
    hit: require('@nayan-engine-example/shared/car-racing/assets/sfx/hit.wav'),
    win: require('@nayan-engine-example/shared/car-racing/assets/sfx/win.wav'),
    die: require('@nayan-engine-example/shared/car-racing/assets/sfx/die.wav')
  }
};
