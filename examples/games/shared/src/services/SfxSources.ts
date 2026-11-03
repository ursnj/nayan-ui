// The sound effects Car Racing and the shared game screen use, from the games library's synthesised
// set (its scripts/build-sfx.py). React Native needs each require written out.
export const SFX_SOURCES = {
  boom: require('../assets/sfx/boom.wav'),
  click: require('../assets/sfx/click.wav'),
  coin: require('../assets/sfx/coin.wav'),
  crash: require('../assets/sfx/crash.wav'),
  deselect: require('../assets/sfx/deselect.wav'),
  draw: require('../assets/sfx/draw.wav'),
  game_over: require('../assets/sfx/game_over.wav'),
  pop: require('../assets/sfx/pop.wav'),
  start: require('../assets/sfx/start.wav'),
  swoosh: require('../assets/sfx/swoosh.wav'),
  time_up: require('../assets/sfx/time_up.wav'),
  whoosh: require('../assets/sfx/whoosh.wav'),
  win: require('../assets/sfx/win.wav')
};
export type SfxName = keyof typeof SFX_SOURCES;
