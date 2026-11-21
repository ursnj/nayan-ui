import { createContext } from 'react';

/** Asset loaders warm the engine before mounting a game, so it can draw immediately. */
export const EngineReadyContext = createContext(false);
