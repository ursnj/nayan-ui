'use client';

import { useSyncExternalStore } from 'react';
import { getOnlineSnapshot, getServerOnlineSnapshot, network } from './network';
import type { OnlineState } from './types';

export function useOnline(): OnlineState {
  return useSyncExternalStore(network.subscribe, getOnlineSnapshot, getServerOnlineSnapshot);
}
