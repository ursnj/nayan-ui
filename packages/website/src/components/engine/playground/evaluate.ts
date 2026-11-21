import type { ComponentType } from 'react';

export function evaluateExample(js: string, modules: Readonly<Record<string, unknown>>, output: Console = console): ComponentType {
  const module = { exports: {} as Record<string, unknown> };
  function require(name: string) {
    if (Object.hasOwn(modules, name)) return modules[name];
    throw new Error(`The example editor does not provide "${name}".`);
  }

  // Callers supply either a bundled starter or source that the user explicitly ran.
  new Function('require', 'module', 'exports', 'console', js)(require, module, module.exports, output);
  const component = module.exports.default;
  if (typeof component !== 'function') throw new Error('Export a React component as the default export.');
  return component as ComponentType;
}
