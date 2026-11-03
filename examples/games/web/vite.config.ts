import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const SHARED = fileURLToPath(new URL('../shared/src/', import.meta.url));

function metroRequires(): Plugin {
  return {
    name: 'metro-requires',
    enforce: 'pre',
    transform(code, id) {
      if (!id.startsWith(SHARED) || !/\.[jt]sx?$/.test(id)) return;
      let out = code.replace(
        /require\((['"])([^'"]+\.(?:wav|png|ttf|glb))\1\)/g,
        (_, _quote, path) => `new URL(${JSON.stringify(path)}, import.meta.url).href`
      );
      if (out.includes("require('@nayan-ui/engine')"))
        out = `import * as __engine from '@nayan-ui/engine';\n` + out.replaceAll("require('@nayan-ui/engine')", '__engine');
      return out === code ? undefined : { code: out, map: null };
    }
  };
}

export default defineConfig({
  plugins: [metroRequires(), tailwindcss()],
  resolve: {
    alias: [{ find: /^react-native$/, replacement: 'react-native-web' }],
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.mjs', '.js', '.json'],
    dedupe: ['react', 'react-dom', 'react-native-web', '@nayan-ui/engine']
  },
  define: {
    '__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production'),
    'process.env.EXPO_PUBLIC_AUTOPLAY': JSON.stringify(process.env.EXPO_PUBLIC_AUTOPLAY ?? '0')
  },
  build: { rolldownOptions: { onwarn: (warning, warn) => warning.code !== 'MODULE_LEVEL_DIRECTIVE' && warn(warning) } }
});
