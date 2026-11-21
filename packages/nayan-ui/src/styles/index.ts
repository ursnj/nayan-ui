/// <reference types="node" />
import { spawn } from 'node:child_process';
/** Node-only build tooling. Browser/game imports never include the compiler or CSS parsers. */
import { createHash } from 'node:crypto';
import { existsSync, watch } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { compile_utilities, initSync } from '../../native/core/build/web/engine_core.js';

export interface EngineStylesOptions {
  root?: string;
  source: string;
  content: readonly string[];
  output: string;
  cssOutput: string;
  /** Set to false when the source already uses flat CSS rules. */
  lowerCss?: boolean;
  font?: string;
  manifest?: string;
  publicPath?: string;
}
const require = createRequire(import.meta.url);
const engineRoot = path.dirname(require.resolve('nayan-ui/package.json'));
const engineComponents = path.join(engineRoot, 'src/components');
type SelectorTest =
  | ['class' | 'id' | 'tag' | 'pseudo-element', string]
  | ['attr', string, string, string]
  | ['where' | 'is' | 'not', CompiledSelector[]]
  | ['pseudo', string, string];
interface SelectorPart {
  tests: SelectorTest[];
  relation: string;
}
interface CompiledSelector {
  parts: SelectorPart[];
  specificity: number;
}
let initialized = false;
export function compileUtilities(classes: readonly string[]): { css: string; supported: string[]; unsupported: string[] } {
  if (!initialized) {
    const native = path.join(engineRoot, 'native/core/build/web/engine_core_bg.wasm');
    initSync({ module: require('node:fs').readFileSync(existsSync(native) ? native : path.join(engineRoot, 'lib/web/engine_core_bg.wasm')) });
    initialized = true;
  }
  return JSON.parse(compile_utilities(JSON.stringify({ classes })));
}

export const enginePreflight = `@layer theme,base,components,utilities;
@layer base{*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid}html{font-family:system-ui,sans-serif;line-height:1.5;-webkit-text-size-adjust:100%;tab-size:4}body{margin:0}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}h1,h2,h3,h4,h5,h6,p,figure,blockquote,dl,dd{margin:0}a{color:inherit;text-decoration:inherit}button,input,textarea,select{font:inherit;letter-spacing:inherit;color:inherit;border-radius:0;opacity:1;background:transparent}button,[type=button],[type=submit],[type=reset]{appearance:button}button,[role=button],a[href]{cursor:pointer}button:disabled,[aria-disabled=true]{cursor:default}img,svg,video,canvas{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}ol,ul,menu{list-style:none;margin:0;padding:0}table{text-indent:0;border-color:inherit;border-collapse:collapse}textarea{resize:vertical}::placeholder{opacity:1}summary{display:list-item}[hidden]:not([hidden=until-found]){display:none!important}}
@keyframes nayan-spin{to{transform:rotate(360deg)}}`;

async function sourceFiles(input: string): Promise<string[]> {
  const entries = await readdir(input, { withFileTypes: true }).catch(() => null);
  if (!entries) return /\.[cm]?[jt]sx?$/.test(input) ? [input] : [];
  return (
    await Promise.all(
      entries
        .filter((e) => !['node_modules', '.next', 'lib', 'build', '__tests__'].includes(e.name))
        .map((e) => (e.isDirectory() ? sourceFiles(path.join(input, e.name)) : /\.[cm]?[jt]sx?$/.test(e.name) ? [path.join(input, e.name)] : []))
    )
  ).flat();
}
async function writeChanged(file: string, contents: string) {
  if ((await readFile(file, 'utf8').catch(() => null)) === contents) return;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, contents);
}
export async function buildStyles(options: EngineStylesOptions) {
  const root = path.resolve(options.root ?? process.cwd());
  const input = path.resolve(root, options.source);
  const files = (await Promise.all([...options.content.map((p) => path.resolve(root, p)), engineComponents].map(sourceFiles))).flat();
  const classes = new Set<string>();
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/[^\s"'`<>={}$;]+/g)) {
      const word = match[0].replace(/[,;]+$/, '');
      if (word.length <= 2048 && /^(?:!?-?[a-z][a-z0-9-]*|\[)/.test(word) && !word.includes('\\') && !word.includes('://')) classes.add(word);
    }
  }
  const utilities = compileUtilities([...classes]);
  const source = await readFile(input, 'utf8');
  let css = `${enginePreflight}\n${source}\n@layer utilities{${utilities.css}}`;
  if (options.lowerCss !== false) {
    const { Features, transform } = createRequire(path.join(root, 'package.json'))('lightningcss') as typeof import('lightningcss');
    css = transform({
      filename: input,
      code: Buffer.from(css),
      targets: { chrome: 100 << 16, safari: 15 << 16 },
      include: Features.Nesting,
      minify: false
    }).code.toString();
  }
  const rules: unknown[] = [];
  function selector(value: string): CompiledSelector[] {
    const result: CompiledSelector[] = [];
    selectorParser((selectors) => {
      selectors.each((sel) => {
        const parts: SelectorPart[] = [];
        let current: SelectorPart = { tests: [], relation: ' ' };
        const flush = () => {
          if (current.tests.length) {
            parts.push(current);
            current = { tests: [], relation: ' ' };
          }
        };
        sel.each((token) => {
          if (token.type === 'combinator') {
            flush();
            current.relation = token.value.trim() || ' ';
            return;
          }
          if (token.type === 'class' || token.type === 'id' || token.type === 'tag') {
            current.tests.push([token.type, token.value]);
            return;
          }
          if (token.type === 'attribute') {
            current.tests.push(['attr', token.attribute, token.operator || '', token.value || '']);
            return;
          }
          if (token.type === 'universal') return;
          if (token.type === 'pseudo') {
            if (token.value.startsWith('::')) {
              current.tests.push(['pseudo-element', token.value.slice(2)]);
              return;
            }
            if (token.value === ':where' || token.value === ':is' || token.value === ':not') {
              current.tests.push([token.value.slice(1) as 'where' | 'is' | 'not', token.nodes?.flatMap((n) => selector(n.toString())) ?? []]);
              return;
            }
            current.tests.push(['pseudo', token.value.slice(1), token.nodes?.map((n) => n.toString()).join('') || '']);
          }
        });
        flush();
        // Specificity follows the original cascade; :where contributes zero.
        const weight = (tests: SelectorTest[]): number =>
          tests.reduce(
            (total, test) =>
              total +
              (test[0] === 'id'
                ? 100
                : test[0] === 'class' || test[0] === 'attr'
                  ? 10
                  : test[0] === 'tag'
                    ? 1
                    : test[0] === 'where'
                      ? 0
                      : test[0] === 'is' || test[0] === 'not'
                        ? Math.max(0, ...test[1].map((p) => p.parts.reduce((n, p) => n + weight(p.tests), 0)))
                        : test[0] === 'pseudo-element'
                          ? 1
                          : 10),
            0
          );
        result.push({ parts, specificity: parts.reduce((n, p) => n + weight(p.tests), 0) });
      });
    }).processSync(value);
    return result;
  }
  postcss.parse(css).walkRules((rule) => {
    if (options.lowerCss === false && rule.some((node) => node.type === 'rule' || node.type === 'atrule')) {
      throw new Error(`lowerCss: false requires flat CSS rules. Found nesting in ${rule.selector}.`);
    }
    const media: string[] = [];
    let layer = 4;
    let parent = rule.parent;
    let skip = false;
    while (parent && parent.type !== 'root') {
      if (parent.type === 'atrule') {
        if (parent.name === 'media') media.push(parent.params);
        if (parent.name === 'layer') layer = ['theme', 'base', 'components', 'utilities'].indexOf(parent.params);
        if (['keyframes', '-webkit-keyframes', 'property'].includes(parent.name)) skip = true;
        if (parent.name === 'supports' && !parent.params.includes('color-mix') && !parent.params.includes('contain-intrinsic-size')) skip = true;
      }
      parent = parent.parent;
    }
    if (skip) return;
    const declarations: [string, string, boolean][] = [];
    rule.each((node) => {
      if (node.type === 'decl') declarations.push([node.prop, node.value, !!node.important]);
    });
    if (!declarations.length) return;
    try {
      for (const sel of selector(rule.selector)) rules.push({ ...(sel as object), layer, media, declarations });
    } catch (error) {
      throw new Error(`Unsupported selector ${rule.selector}`, { cause: error });
    }
  });

  const stylesheet = { version: 1, rules, ...(options.font ? { font: (await readFile(path.resolve(root, options.font))).toString('base64') } : {}) };
  const json = JSON.stringify(stylesheet);
  await writeChanged(path.resolve(root, options.output), json);
  await writeChanged(path.resolve(root, options.cssOutput), css);
  if (options.manifest) {
    const version = createHash('sha256').update(json).digest('hex').slice(0, 16);
    await writeChanged(
      path.resolve(root, options.manifest),
      `// Generated by nayan-ui/styles.\nexport const stylesheet = ${JSON.stringify(`${options.publicPath ?? '/engine/site-styles.json'}?v=${version}`)};\n`
    );
  }
  return { rules: rules.length, utilities: utilities.supported.length };
}

/** Recompile source edits in development and shut down cleanly with the host dev server. */
export async function developStyles(options: EngineStylesOptions, command: readonly string[]) {
  await buildStyles(options);
  const root = path.resolve(options.root ?? process.cwd());
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = Promise.resolve();
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      running = running.then(async () => {
        try {
          await buildStyles(options);
        } catch (error) {
          console.error('Engine styles:', error);
        }
      });
    }, 80);
  };
  const ignored = new Set([options.cssOutput, options.manifest].filter(Boolean).map((p) => path.resolve(root, p!)));
  const directories = new Set([
    ...options.content.map((p) => path.resolve(root, p)),
    engineComponents,
    path.dirname(path.resolve(root, options.source))
  ]);
  const watchers = [...directories].map((directory) =>
    watch(directory, { recursive: true }, (_event, file) => {
      if (!file) return;
      const pathName = path.resolve(directory, String(file));
      if (!ignored.has(pathName) && /\.(?:css|[cm]?[jt]sx?)$/.test(pathName)) schedule();
    })
  );
  const child = spawn(command[0]!, command.slice(1), { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  const stop = () => {
    clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
  };
  const signal = () => {
    stop();
    child.kill('SIGTERM');
  };
  process.once('SIGINT', signal);
  process.once('SIGTERM', signal);
  return await new Promise<number>((resolve, reject) => {
    child.once('error', (error) => {
      stop();
      reject(error);
    });
    child.once('exit', (code) => {
      stop();
      process.removeListener('SIGINT', signal);
      process.removeListener('SIGTERM', signal);
      resolve(code ?? 0);
    });
  });
}
