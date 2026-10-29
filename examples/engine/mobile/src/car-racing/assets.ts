import type { AssetSources } from "@nayan-engine-example/shared/car-racing";

export const sources: AssetSources = {
  font: require("@nayan-engine-example/shared/car-racing/assets/fonts/Inter-SemiBold.ttf"),
  textures: {
    asphalt: require("@nayan-engine-example/shared/car-racing/assets/textures/asphalt.png"),
    facade: require("@nayan-engine-example/shared/car-racing/assets/textures/facade.png"),
    grass: require("@nayan-engine-example/shared/car-racing/assets/textures/grass.png"),
    ad_chevrons: require("@nayan-engine-example/shared/car-racing/assets/textures/ad_chevrons.png"),
    ad_bubbles: require("@nayan-engine-example/shared/car-racing/assets/textures/ad_bubbles.png"),
    ad_bolt: require("@nayan-engine-example/shared/car-racing/assets/textures/ad_bolt.png"),
  },
  sounds: {
    engine: require("@nayan-engine-example/shared/car-racing/assets/sfx/engine.wav"),
    nitro: require("@nayan-engine-example/shared/car-racing/assets/sfx/nitro.wav"),
    point: require("@nayan-engine-example/shared/car-racing/assets/sfx/point.wav"),
    hit: require("@nayan-engine-example/shared/car-racing/assets/sfx/hit.wav"),
    win: require("@nayan-engine-example/shared/car-racing/assets/sfx/win.wav"),
    die: require("@nayan-engine-example/shared/car-racing/assets/sfx/die.wav"),
    bump: require("@nayan-engine-example/shared/car-racing/assets/sfx/bump.wav"),
  },
};
