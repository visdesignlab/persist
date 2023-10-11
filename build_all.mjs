import fs from 'fs';
import * as c from './vite.config.mjs';
import { build } from 'vite';

const { configCreator } = c;

const entryPaths = JSON.parse(
  fs.readFileSync('./persist_ext/internals/widgets/widget_map.json', {
    encoding: 'utf8'
  })
);

let first = true;

const entries = Object.entries(entryPaths);

for (let i = 0; i < entries.length; ++i) {
  const [name, entry] = entries[i];
  const config = configCreator(entry, first);
  first = false;
  console.log(`Building: ${name} (${i + 1}/${entries.length})`);
  await build(config);
}
