import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// The gallery is React DOM; the shared examples are React Native components, rendered by
// react-native-web, and their `.web.ts` files win over the Metro ones.
export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: [{ find: /^react-native$/, replacement: 'react-native-web' }],
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.mjs', '.js', '.jsx', '.json'],
    dedupe: ['react', 'react-dom', 'react-native-web', '@nayan-ui/engine']
  },
  define: { __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production') },
  // react-native-web's 'use client' lines mean nothing to a client-only bundle.
  build: { rolldownOptions: { onwarn: (warning, warn) => warning.code !== 'MODULE_LEVEL_DIRECTIVE' && warn(warning) } }
});
