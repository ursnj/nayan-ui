import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import enginePackage from 'nayan-ui/package.json';
import { componentAttributeNames } from '../src/services/nayan-ui/component-attribute-names';
import { componentReferences } from '../src/services/nayan-ui/component-reference';

type ReferenceModule = (typeof componentReferences)[number]['module'];
type Platform = 'web' | 'native';
type ExportTypes = { browser?: { types?: string }; 'react-native'?: { types?: string }; types?: string };

const engine = new URL('../../nayan-ui/', import.meta.url);
const output = new URL('../src/services/nayan-ui/component-attributes.json', import.meta.url);
const packageExports = enginePackage.exports as Record<string, ExportTypes>;
const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const declarationsRoot = fileURLToPath(new URL('lib/', engine));

const entryPaths = (platform: Platform) => new Map(
  [...new Set(componentReferences.map(({ module }) => module))].map((module) => {
    const entry = packageExports[`./${module}`];
    const path = platform === 'native' ? entry?.['react-native']?.types : entry?.browser?.types ?? entry?.types;
    if (!path) throw new Error(`No public ${platform} type declarations for nayan-ui/${module}`);
    return [module, fileURLToPath(new URL(path, engine))];
  })
);
const webEntries = entryPaths('web');
const nativeEntries = entryPaths('native');
const program = ts.createProgram([...webEntries.values(), ...nativeEntries.values()], {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  skipLibCheck: true,
  types: []
});
const checker = program.getTypeChecker();

function moduleExports(entries: Map<ReferenceModule, string>, platform: Platform) {
  return new Map([...entries].map(([module, path]) => {
    const file = program.getSourceFile(path);
    const symbol = file && checker.getSymbolAtLocation(file);
    if (!symbol) throw new Error(`Build the nayan-ui ${platform} declarations before generating the ${module} reference.`);
    return [module, new Map(checker.getExportsOfModule(symbol).map((item) => [
      item.name,
      item.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(item) : item
    ]))];
  }));
}

interface Attribute {
  name: string;
  type: string;
  required: boolean;
  details?: string;
  defaultValue?: string;
}

interface ComponentApi {
  props: number[];
  methods: number[];
  value: number[];
}

function describe(symbol: ts.Symbol, location: ts.Node): Attribute {
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0] ?? location;
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const required = !(symbol.flags & ts.SymbolFlags.Optional);
  const docs = ts.displayPartsToString(symbol.getDocumentationComment(checker));
  const tags = symbol.getJsDocTags(checker);
  const defaultValue = tags.find(({ name }) => name === 'default' || name === 'defaultValue');
  const deprecated = tags.find(({ name }) => name === 'deprecated');
  const details = [docs, deprecated && `Deprecated. ${ts.displayPartsToString(deprecated.text)}`.trim()].filter(Boolean).join(' ');
  const printed = checker.typeToString(type, declaration, flags);
  return {
    name: symbol.name,
    type: required ? printed : printed.replace(/^undefined \| | \| undefined$/g, ''),
    required,
    ...(details && { details }),
    ...(defaultValue?.text && { defaultValue: ts.displayPartsToString(defaultValue.text) })
  };
}

const attributes: Attribute[] = [];
const rowIds = new Map<string, number>();

function rows(symbols: readonly ts.Symbol[], location: ts.Node) {
  return symbols.map((symbol) => {
    const row = describe(symbol, location);
    const key = JSON.stringify(row);
    const existing = rowIds.get(key);
    if (existing !== undefined) return existing;
    const id = attributes.push(row) - 1;
    rowIds.set(key, id);
    return id;
  });
}

function componentApis(entries: Map<ReferenceModule, string>, platform: Platform) {
  const modules = moduleExports(entries, platform);
  const sharedProps = modules.get('components')!.get('ComponentProps')!;
  const shared = new Set(checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(sharedProps)).map((prop) => prop.declarations?.[0]));
  const isEngineMember = (prop: ts.Symbol) => prop.declarations?.some((node) => node.getSourceFile().fileName.startsWith(declarationsRoot));
  const components: Record<string, ComponentApi> = {};

  for (const { symbol: name, module } of componentReferences) {
    if (components[name]) continue;
    const symbol = modules.get(module)!.get(name);
    const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
    if (!symbol || !declaration) throw new Error(`Missing public export nayan-ui/${module}#${name} (${platform})`);
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    // React ComponentType can be a union of constructors and callable components.
    const members = type.isUnion() ? type.types : [type];
    // Prefer the general overload when it shares a prop with a specialized one.
    const signatures = members.flatMap((member) => member.getCallSignatures())
      .reverse()
      .sort((first, second) => (first.typeParameters?.length ?? 0) - (second.typeParameters?.length ?? 0));
    const props = new Map<string, ts.Symbol>();
    const hook = name.startsWith('use');

    for (const signature of signatures) {
      const parameters = signature.getParameters();
      const properties = hook
        ? parameters
        : parameters[0] ? checker.getTypeOfSymbolAtLocation(parameters[0], declaration).getProperties() : [];
      for (const property of properties) {
        if (!props.has(property.name)) props.set(property.name, property);
      }
    }

    const names = componentAttributeNames[name];
    const selected = names
      ? names.flatMap((prop) => {
          const field = props.get(prop);
          return field ? [field] : [];
        })
      : [...props.values()].filter((prop) => hook || (isEngineMember(prop) && !shared.has(prop.declarations?.[0])))
          .sort((a, b) => a.name.localeCompare(b.name, 'en'));
    components[name] = {
      props: rows(selected, declaration),
      methods: rows(type.getProperties().filter(isEngineMember), declaration),
      value: rows(hook ? signatures[0]?.getReturnType().getProperties() ?? [] : [], declaration)
    };
  }
  return components;
}

const web = componentApis(webEntries, 'web');
const native = componentApis(nativeEntries, 'native');
for (const [name, props] of Object.entries(componentAttributeNames)) {
  const documented = new Set([...web[name]!.props, ...native[name]!.props].map((id) => attributes[id]!.name));
  for (const prop of props) {
    if (!documented.has(prop)) throw new Error(`Unknown documented attribute ${name}.${prop}`);
  }
}
const nativeAlternatives = Object.entries(native).filter(([name, api]) => JSON.stringify(web[name]) !== JSON.stringify(api));
const serializeApis = (entries: [string, ComponentApi][]) => entries.map(([name, api]) => `    ${JSON.stringify(name)}: ${JSON.stringify(api)}`).join(',\n');
const json = [
  '{',
  '  "attributes": [',
  attributes.map((row) => `    ${JSON.stringify(row)}`).join(',\n'),
  '  ],',
  '  "components": {',
  serializeApis(Object.entries(web)),
  '  },',
  '  "native": {',
  serializeApis(nativeAlternatives),
  '  }',
  '}',
  ''
].join('\n');

if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== json) throw new Error('Component attributes have changed. Run bun run reference:generate.');
} else {
  writeFileSync(output, json);
}
console.log(`Checked ${Object.keys(web).length} component and hook APIs for React and React Native.`);
