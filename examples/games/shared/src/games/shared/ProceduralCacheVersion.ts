// Saved-model revisions, from the games library's scripts/procedural-cache-version.cjs (Car Racing's
// only). Change car-racing's when its procedural models change, so saved copies are rebuilt.
/** Follows every source: for cache keys outside a game folder's namespace. */
export const PROCEDURAL_CACHE_VERSION = '4ed78c8647c15e10d298f3c2725979ff';
/** Per namespace ("<folder>/..." keys): a game's own sources, what it imports, shared code and the engine. */
export const PROCEDURAL_CACHE_VERSIONS: Readonly<Record<string, string>> = {
  'car-racing': 'c75be5c717eef2fb40d4edf956fbc381',
  'shared': 'ff06b0313cd85dafa81308fa0db1e128'
};
