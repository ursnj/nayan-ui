import type { AssetSources } from "@nayan-engine-example/shared/car-racing";

export const sources: AssetSources = {
  models: {
    car_body: require("@nayan-engine-example/shared/car-racing/assets/models/car_body.glb"),
    car_glass: require("@nayan-engine-example/shared/car-racing/assets/models/car_glass.glb"),
    car_trim: require("@nayan-engine-example/shared/car-racing/assets/models/car_trim.glb"),
    tree: require("@nayan-engine-example/shared/car-racing/assets/models/tree.glb"),
  },
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
    die: require("@nayan-engine-example/shared/car-racing/assets/sfx/die.wav"),
    bump: require("@nayan-engine-example/shared/car-racing/assets/sfx/bump.wav"),
  },
};
