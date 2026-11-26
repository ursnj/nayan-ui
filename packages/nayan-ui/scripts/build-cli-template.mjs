import { execFileSync } from 'node:child_process';
import { lstat, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const template = fileURLToPath(new URL('../../../templates/nayan-ui/', import.meta.url));
const paths = execFileSync('git', ['ls-files', '-z', '--', '.'], { cwd: template, encoding: 'utf8' }).split('\0').filter(Boolean);
for (const path of ['package.json', 'bun.lock', 'mobile/app.json', 'web/index.html']) {
  if (!paths.includes(path)) throw new Error(`Missing starter template file ${path}.`);
}
const entries = await Promise.all(
  paths.map(async (path) => {
    const file = resolve(template, path);
    if (!(await lstat(file)).isFile()) throw new Error(`The starter template must contain only regular files. Found ${path}.`);
    return [path, (await readFile(file)).toString('base64')];
  })
);

await writeFile(new URL('../cli/template.json', import.meta.url), JSON.stringify(Object.fromEntries(entries)));
