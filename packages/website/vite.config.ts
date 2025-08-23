/** @type {import('vite').UserConfig} */
import react from '@vitejs/plugin-react-swc';
import fs from 'fs';
import path from 'path';
import { Plugin, defineConfig } from 'vite';

// Custom plugin to handle raw imports without TypeScript processing
const rawImportPlugin = (): Plugin => ({
  name: 'raw-import-plugin',
  enforce: 'pre' as const, // Run before other plugins
  resolveId(id, importer) {
    // Intercept raw imports from examples directory
    if (id.includes('examples/expo-app') && id.includes('?raw')) {
      // Clean the file path
      const cleanPath = id.replace('?raw', '');

      // Resolve relative to the importer or current working directory
      let absolutePath;
      if (importer) {
        const importerDir = path.dirname(importer);
        absolutePath = path.resolve(importerDir, cleanPath);
      } else {
        absolutePath = path.resolve(cleanPath);
      }

      // Return a virtual module ID that we'll handle in load
      return `virtual:raw-${Buffer.from(absolutePath).toString('base64')}`;
    }
  },
  load(id) {
    // Handle virtual raw modules
    if (id.startsWith('virtual:raw-')) {
      const absolutePath = Buffer.from(id.replace('virtual:raw-', ''), 'base64').toString();

      try {
        const content = fs.readFileSync(absolutePath, 'utf-8');
        return `export default ${JSON.stringify(content)}`;
      } catch (error) {
        console.warn(`Could not read raw file: ${absolutePath}`);
        return `export default ""`;
      }
    }
  }
});

// Vite configuration for monorepo with local nayan source resolution
export default defineConfig({
  base: '/',
  server: {
    host: 'localhost',
    port: 3000,
    open: true
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "use client" directive warnings from node_modules
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) return;
        // Suppress PURE comment annotation warnings from react-helmet-async
        if (warning.message?.includes('/*#__PURE__*/') && warning.message.includes('react-helmet-async')) return;
        warn(warning);
      }
    }
  },
  plugins: [rawImportPlugin(), react()],
  optimizeDeps: {
    esbuildOptions: {
      define: { global: 'globalThis' }
    }
  },
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, './src') }]
  },
  esbuild: {
    // Exclude examples directory from esbuild processing to avoid TypeScript config issues
    exclude: [/examples\/expo-app\/.*\.tsx?$/]
  }
});
