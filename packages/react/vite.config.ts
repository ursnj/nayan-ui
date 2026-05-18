import { esmExternalRequirePlugin } from 'rolldown/plugins';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    esmExternalRequirePlugin({
      external: ['react', 'react-dom', /^react\//, /^react-dom\//]
    })
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: () => 'index.es.js'
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "use client" directive warnings from node_modules
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
          return;
        }
        warn(warning);
      }
    },
    sourcemap: true,
    emptyOutDir: true,
    copyPublicDir: false
  }
});
