// Operations started before an explicit clear may finish for their caller, but cannot refill storage.
let generation = 0;
export const cacheGeneration = () => generation;
export const advanceCacheGeneration = () => ++generation;
