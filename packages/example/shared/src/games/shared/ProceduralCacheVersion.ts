// Saved-model revisions, from the games library's scripts/procedural-cache-version.cjs (Car Racing's
// only). Change car-racing's when its procedural models change, so saved copies are rebuilt.
/** Follows every source: for cache keys outside a game folder's namespace. */
export const PROCEDURAL_CACHE_VERSION = '70e7f3889c4321a96fbf69e459696d5a';
/** Per namespace ("<folder>/..." keys): a game's own sources, what it imports, shared code and the engine. */
export const PROCEDURAL_CACHE_VERSIONS: Readonly<Record<string, string>> = {
  'car-racing': '0e01669465a571fef57649a56ce25f5e',
  'shared': '1c50d7117f17757c703061da9a7991ed'
};
