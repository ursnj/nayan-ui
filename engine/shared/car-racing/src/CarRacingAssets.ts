import type { AssetSources } from './CarRacingConstants';

// React Native bundles assets with Metro's require(...).
export const sources: AssetSources = {
  car: {
    body: require('../assets/models/car_body.glb'),
    glass: require('../assets/models/car_glass.glb'),
    trim: require('../assets/models/car_trim.glb')
  },
  textures: {
    asphalt: require('../assets/textures/asphalt.png'),
    grass: require('../assets/textures/grass.png')
  },
  sounds: {
    engine: require('../assets/sfx/engine.wav'),
    point: require('../assets/sfx/point.wav'),
    hit: require('../assets/sfx/hit.wav'),
    win: require('../assets/sfx/win.wav'),
    die: require('../assets/sfx/die.wav')
  }
};
