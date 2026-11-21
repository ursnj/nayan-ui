import ts from 'typescript';
import type { CompilerRequest, CompilerResponse } from './compiler';

const FILE = '/NayanPlayground.tsx';
const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  esModuleInterop: true,
  skipLibCheck: true,
  types: []
};

function diagnosticMessages(diagnostics: readonly ts.Diagnostic[]) {
  return diagnostics
    .filter(({ category }) => category === ts.DiagnosticCategory.Error)
    .map(({ file, start, messageText }) => {
      const message = ts.flattenDiagnosticMessageText(messageText, '\n');
      if (!file || start === undefined) return message;
      const { line } = file.getLineAndCharacterOfPosition(start);
      return `Line ${line + 1}: ${message}`;
    });
}

async function createLanguageService() {
  const response = await fetch('/game-engine/playground/types');
  if (!response.ok) throw new Error('Could not load TypeScript declarations.');
  const { libs } = (await response.json()) as { libs: { path: string; content: string }[] };
  const files = new Map(libs.map(({ path, content }) => [path.replace(/^file:\/\//, ''), content]));
  let source = '';
  let version = 0;
  const readFile = (path: string) => (path === FILE ? source : files.get(path));
  const service = ts.createLanguageService({
    getCompilationSettings: () => compilerOptions,
    getScriptFileNames: () => [FILE],
    getScriptVersion: (path) => (path === FILE ? String(version) : '0'),
    getScriptSnapshot: (path) => {
      const content = readFile(path);
      return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
    },
    getCurrentDirectory: () => '/',
    getDefaultLibFileName: (options) => `/node_modules/typescript/lib/${ts.getDefaultLibFileName(options)}`,
    fileExists: (path) => readFile(path) !== undefined,
    readFile
  });
  return {
    service,
    setSource(code: string) {
      if (code !== source) {
        source = code;
        version++;
      }
    }
  };
}

let languageService: ReturnType<typeof createLanguageService> | undefined;

async function handle(request: CompilerRequest): Promise<CompilerResponse> {
  const { id, command, code } = request;
  if (command === 'compile') {
    const result = ts.transpileModule(code, { compilerOptions, fileName: FILE, reportDiagnostics: true });
    const problems = diagnosticMessages(result.diagnostics ?? []);
    return problems.length ? { id, error: problems.join('\n') } : { id, output: result.outputText };
  }
  const { service, setSource } = await (languageService ??= createLanguageService());
  setSource(code);
  if (command === 'check') {
    return { id, output: diagnosticMessages([...service.getSyntacticDiagnostics(FILE), ...service.getSemanticDiagnostics(FILE)]) };
  }
  const { position } = request;
  const prefix = code.slice(0, position).match(/[\w$]+$/)?.[0] ?? '';
  const result = service.getCompletionsAtPosition(FILE, position, {});
  const output =
    result?.entries
      .filter(({ name }) => name.toLowerCase().startsWith(prefix.toLowerCase()))
      .slice(0, 20)
      .map((entry) => {
        const span = entry.replacementSpan ?? result.optionalReplacementSpan;
        const start = span?.start ?? position - prefix.length;
        return { label: entry.name, text: entry.insertText ?? entry.name, start, end: span ? start + span.length : position };
      }) ?? [];
  return { id, output };
}

self.onmessage = async ({ data }: MessageEvent<CompilerRequest>) => {
  try {
    self.postMessage(await handle(data));
  } catch (error) {
    self.postMessage({ id: data.id, error: error instanceof Error ? error.message : String(error) } satisfies CompilerResponse);
  }
};
