import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const SHARED = fileURLToPath(new URL('../shared/src/', import.meta.url));

/**
 * The shared games are Metro code: `require('./x.wav')` becomes a URL Vite emits, and the lazy
 * `require('@nayan-ui/engine')` an import (as the games library's own browser build does).
 */
function metroRequires(): Plugin {
  return {
    name: 'metro-requires',
    enforce: 'pre',
    transform(code, id) {
      if (!id.startsWith(SHARED) || !/\.[jt]sx?$/.test(id)) return;
      let out = code.replace(
        /require\((['"])([^'"]+\.(?:wav|mp3|png|jpe?g|glb|gltf|ttf))\1\)/g,
        (_, _quote, path) => `new URL(${JSON.stringify(path)}, import.meta.url).href`
      );
      if (/require\(['"]@nayan-ui\/engine['"]\)/.test(out)) {
        out = `import * as __engine from '@nayan-ui/engine';\n` + out.replace(/require\(['"]@nayan-ui\/engine['"]\)/g, '__engine');
      }
      return out === code ? undefined : { code: out, map: null };
    }
  };
}

// The pages are React DOM; the shared games are React Native components, rendered by
// react-native-web, and `.web.ts` files win over the Metro ones.
export default defineConfig({
  plugins: [metroRequires(), tailwindcss()],
  resolve: {
    alias: [{ find: /^react-native$/, replacement: 'react-native-web' }],
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.mjs', '.js', '.jsx', '.json'],
    dedupe: ['react', 'react-dom', 'react-native-web', '@nayan-ui/engine']
  },
  define: {
    '__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production'),
    'process.env.EXPO_PUBLIC_AUTOPLAY': JSON.stringify(process.env.EXPO_PUBLIC_AUTOPLAY ?? '0')
  },
  // react-native-web's 'use client' lines mean nothing to a client-only bundle.
  build: { rolldownOptions: { onwarn: (warning, warn) => warning.code !== 'MODULE_LEVEL_DIRECTIVE' && warn(warning) } }
});
