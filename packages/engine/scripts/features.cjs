// These are the public Cargo features used by host build integrations.
const supported = new Set([
  'games',
  'drawing',
  'components',
  'markdown',
  'storage',
  'uuid',
  'image-picker',
  'audio',
  'microphone',
  'haptics',
  'tts',
  'keep-awake',
  'review',
  'permissions',
  'sqlite',
  'video',
  'location'
]);

function selectFeatures(features) {
  if (!Array.isArray(features) || features.some((feature) => !supported.has(feature))) {
    throw new Error(`Nayan Engine features must be an array containing only: ${[...supported].join(', ')}`);
  }
  return [...new Set(features)].sort().join(',');
}

module.exports = { selectFeatures };
