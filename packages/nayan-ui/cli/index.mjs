#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const usage = 'Usage: nayan-ui new <project-name>\n\nCreate a Nayan UI starter workspace for web, iOS, and Android.';
const args = process.argv.slice(2);

async function scaffold(name) {
  if (!name || name.length > 64 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error('Use a project name of up to 64 lowercase letters, digits, and hyphens, starting with a letter.');
  }

  const entries = JSON.parse(await readFile(new URL('./template.json', import.meta.url), 'utf8'));
  const files = new Map(Object.entries(entries).map(([path, data]) => [path, Buffer.from(data, 'base64')]));
  const manifest = JSON.parse(files.get('package.json').toString());
  const appConfig = JSON.parse(files.get('mobile/app.json').toString());
  files.set(
    'bun.lock',
    files
      .get('bun.lock')
      .toString()
      .replace(`"name": ${JSON.stringify(manifest.name)}`, `"name": ${JSON.stringify(name)}`)
  );
  manifest.name = name;
  Object.assign(appConfig.expo, { name, slug: name, scheme: name });
  appConfig.expo.ios.bundleIdentifier = `com.example.${name}`;
  appConfig.expo.android.package = `com.example.${name.replaceAll('-', '_')}`;
  files.set('package.json', `${JSON.stringify(manifest, null, 2)}\n`);
  files.set('mobile/app.json', `${JSON.stringify(appConfig, null, 2)}\n`);
  files.set('web/index.html', files.get('web/index.html').toString().replace('<title>Nayan UI Starter</title>', `<title>${name}</title>`));

  const target = resolve(name);
  try {
    await mkdir(target);
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`The destination already exists: ${target}`, { cause: error });
    throw error;
  }

  try {
    for (const [path, data] of files) {
      const file = resolve(target, path);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, data, { flag: 'wx' });
    }
  } catch (error) {
    await rm(target, { recursive: true, force: true });
    throw error;
  }

  console.log(`Created ${name}.\n\n  cd ${name}\n  bun install --frozen-lockfile\n  bun run web`);
}

if (!args.length || args.at(-1) === '--help' || args.at(-1) === '-h') {
  console.log(usage);
} else {
  try {
    if (args[0] !== 'new' || args.length !== 2) throw new Error(usage);
    await scaffold(args[1]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
