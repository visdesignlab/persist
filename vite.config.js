import anywidget from "@anywidget/vite";
import path from "path";
import { defineConfig } from "vite";

const OUTPUT_DIR = "src/persist_ext/static";

const basePath = path.join("src/tsx");

/**
 * Record<widget-name, path-to-entry>
 */
const entryPoints = {
  counter: path.join(basePath, "counter", "counter.tsx"),
  trrack: path.join(basePath, "trrack", "trrack.tsx"),
};

export default defineConfig({
  build: {
    outDir: OUTPUT_DIR,
    lib: {
      entry: Object.values(entryPoints),
      formats: ["es"],
      fileName: (_, name) => {
        return `${name}/index.js`;
      },
    },
  },
  define: {
    process: {
      env: "import.meta.env.MODE",
    },
  },
  plugins: [anywidget()],
});
