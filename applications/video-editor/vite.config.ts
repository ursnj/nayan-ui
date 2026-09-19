import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

/** Where the editor is served from, in dev and in production alike. */
const BASE = "/video-editor/start/";

/**
 * Serves the base path without its trailing slash, in dev.
 *
 * Vite redirects the site root to `base` but leaves `base` minus its slash to
 * fall through to a 404, so the deployed URL — which has no trailing slash —
 * was the one spelling that did not open in dev.
 *
 * The request is rewritten internally rather than redirected, so the address
 * bar keeps the URL the user typed. That also matches production, where
 * next.config rewrites the same path onto the bundle's index.html and Next's
 * own trailing-slash handling settles on the slashless form. Assets are
 * unaffected either way: an absolute `base` means every emitted URL is
 * absolute already.
 *
 * Registered inside `configureServer` rather than from a returned function,
 * which is what puts it ahead of Vite's own middlewares and therefore ahead
 * of the 404.
 */
const serveBareBase = (): Plugin => ({
  name: "editor-serve-bare-base",
  apply: "serve",
  configureServer(server) {
    const bare = BASE.slice(0, -1);
    server.middlewares.use((request, _response, next) => {
      const [path, query] = (request.url ?? "").split("?");
      if (path === bare) request.url = query ? `${BASE}?${query}` : BASE;
      next();
    });
  },
});

/**
 * The editor ships inside the marketing site rather than as its own image,
 * served from nayanui.com/video-editor/start — a path under the page that
 * describes it, so the app and its landing page share one URL prefix.
 *
 * Two consequences: every emitted asset URL has to carry the
 * `/video-editor/start/` prefix, and the bundle is written straight into the
 * site's `public` folder so Next picks it up as static output — which saves a
 * staging step and a second deployment.
 *
 * `/video-editor` itself is a Next route, and a static folder cannot shadow a
 * route, so the bare path keeps serving the landing page while the subpath
 * serves the app. Next needs a rewrite to map the extensionless URL onto the
 * bundle's `index.html`; see `rewrites` in the site's next.config.
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
    tailwindcss(),
    serveBareBase(),
  ],
  optimizeDeps: {
    /*
     * @nayan-ui/react is a workspace package built into its own dist. Left to
     * pre-bundle it, Vite caches a copy and keeps serving that after the
     * library is rebuilt — so library fixes silently don't reach the dev
     * server until someone clears .vite by hand.
     */
    exclude: ["@nayan-ui/react"],
  },
  resolve: {
    /*
     * @nayan-ui/react is excluded from pre-bundling so library rebuilds are
     * picked up immediately. That means Vite serves the library as raw ESM,
     * and its transitive `react` import can resolve to a second copy. Deduping
     * forces every import of React to the same instance.
     */
    dedupe: ["react", "react-dom"],
  },
  base: BASE,
  build: {
    outDir: fileURLToPath(new URL("../website/public/video-editor/start", import.meta.url)),
    // Vite refuses to clear an outDir outside the package root unless asked.
    emptyOutDir: true,
  },
});
