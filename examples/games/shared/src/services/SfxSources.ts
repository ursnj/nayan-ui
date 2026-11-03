// The shared game screen's sound effects, from the games library's synthesised set (its
// scripts/build-sfx.py). React Native needs each require written out.
export const SFX_SOURCES = {
  click: require('../assets/sfx/click.wav'),
  deselect: require('../assets/sfx/deselect.wav')
};
export type SfxName = keyof typeof SFX_SOURCES;
