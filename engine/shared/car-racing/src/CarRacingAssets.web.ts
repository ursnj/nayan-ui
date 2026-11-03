import body from '../assets/models/car_body.glb?url';
import glass from '../assets/models/car_glass.glb?url';
import trim from '../assets/models/car_trim.glb?url';
import die from '../assets/sfx/die.wav?url';
import engine from '../assets/sfx/engine.wav?url';
import hit from '../assets/sfx/hit.wav?url';
import point from '../assets/sfx/point.wav?url';
import win from '../assets/sfx/win.wav?url';
import asphalt from '../assets/textures/asphalt.png?url';
import grass from '../assets/textures/grass.png?url';
import type { AssetSources } from './CarRacingConstants';

// The browser loads assets from URLs (Vite emits them with the build).
export const sources: AssetSources = {
  car: { body, glass, trim },
  textures: { asphalt, grass },
  sounds: { engine, point, hit, win, die }
};
