import type { AssetSources } from "@nayan-engine-example/shared/car-racing";
import textures_asphalt from "@nayan-engine-example/shared/car-racing/assets/textures/asphalt.png?url";
import textures_facade from "@nayan-engine-example/shared/car-racing/assets/textures/facade.png?url";
import textures_grass from "@nayan-engine-example/shared/car-racing/assets/textures/grass.png?url";
import textures_ad_chevrons from "@nayan-engine-example/shared/car-racing/assets/textures/ad_chevrons.png?url";
import textures_ad_bubbles from "@nayan-engine-example/shared/car-racing/assets/textures/ad_bubbles.png?url";
import textures_ad_bolt from "@nayan-engine-example/shared/car-racing/assets/textures/ad_bolt.png?url";
import sounds_engine from "@nayan-engine-example/shared/car-racing/assets/sfx/engine.wav?url";
import sounds_nitro from "@nayan-engine-example/shared/car-racing/assets/sfx/nitro.wav?url";
import sounds_point from "@nayan-engine-example/shared/car-racing/assets/sfx/point.wav?url";
import sounds_hit from "@nayan-engine-example/shared/car-racing/assets/sfx/hit.wav?url";
import sounds_die from "@nayan-engine-example/shared/car-racing/assets/sfx/die.wav?url";
import sounds_bump from "@nayan-engine-example/shared/car-racing/assets/sfx/bump.wav?url";

import finishFont from "@nayan-engine-example/shared/car-racing/assets/fonts/Inter-SemiBold.ttf?url";
import sounds_win from "@nayan-engine-example/shared/car-racing/assets/sfx/win.wav?url";

export const sources: AssetSources = {
  font: finishFont,
  textures: {
    asphalt: textures_asphalt,
    facade: textures_facade,
    grass: textures_grass,
    ad_chevrons: textures_ad_chevrons,
    ad_bubbles: textures_ad_bubbles,
    ad_bolt: textures_ad_bolt,
  },
  sounds: {
    engine: sounds_engine,
    nitro: sounds_nitro,
    point: sounds_point,
    hit: sounds_hit,
    die: sounds_die,
    win: sounds_win,
    bump: sounds_bump,
  },
};
