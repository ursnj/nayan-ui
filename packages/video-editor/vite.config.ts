import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/**
 * The editor ships inside the marketing site rather than as its own image,
 * served from nayanui.com/editor.
 *
 * Two consequences: every emitted asset URL has to carry the `/editor/`
 * prefix, and the bundle is written straight into the site's `public` folder
 * so Next picks it up as static output — which saves a staging step and a
 * second deployment.
 */
export default defineConfig({
  plugins: [
    /*
     * The React Compiler memoises components and hook results at build time,
     * which matters here because the editor re-renders under real pressure:
     * the store notifies every subscriber sixty times a second during
     * playback, and a drag fires a store write per pointer move.
     *
     * It is conservative — anything it cannot prove safe is left exactly as
     * written — so the hand-written `memo` and `useCallback` in the timeline
     * stay as they are rather than being torn out on the assumption that the
     * compiler covers them.
     */
    react({ compiler: { logDiagnostics: true } }),
    tailwindcss()
  ],
  optimizeDeps: {
    /*
     * @nayan-ui/react is a workspace package built into its own dist. Left to
     * pre-bundle it, Vite caches a copy and keeps serving that after the
     * library is rebuilt — so library fixes silently don't reach the dev
     * server until someone clears .vite by hand.
     */
    exclude: ['@nayan-ui/react']
  },
  base: '/editor/',
  build: {
    outDir: fileURLToPath(new URL('../website/public/editor', import.meta.url)),
    // Vite refuses to clear an outDir outside the package root unless asked.
    emptyOutDir: true
  }
});
