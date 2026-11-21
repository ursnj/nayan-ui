export function audioWorkletUrl(): URL {
  return new URL('./audio-worklet.js', import.meta.url);
}
