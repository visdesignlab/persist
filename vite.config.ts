import anywidget from '@anywidget/vite';
import path from 'path';
import { defineConfig } from 'vite';

const OUTPUT_DIR = 'persist_ext/static';

const basePath = path.join('src', 'widgets');

/**
 * Record<widget-name, path-to-entry>
 */
const entryPoints = {
  trrack: path.join(basePath, 'trrack', 'Trrack.tsx'),
  header: path.join(basePath, 'header', 'Header.tsx'),
  body: path.join(basePath, 'body', 'Body.tsx'),
  vegalite: path.join(basePath, 'vegalite', 'Vegalite.tsx')
};

export default defineConfig({
  build: {
    outDir: OUTPUT_DIR,
    lib: {
      entry: Object.values(entryPoints),
      formats: ['es'],
      fileName: (_, name) => {
        return `${name}/index.js`;
      }
    }
  },
  define: {
    process: {
      env: 'import.meta.env.MODE'
    }
  },
  plugins: [anywidget()]
});
