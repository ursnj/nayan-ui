import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const report = readFileSync(new URL('../../../coverage/engine/lcov.info', import.meta.url), 'utf8');
const covered = new Set();
const totals = { LF: 0, LH: 0, FNF: 0, FNH: 0 };
for (const record of report.split('end_of_record')) {
  const fields = new Map(
    record
      .trim()
      .split('\n')
      .map((line) => {
        const colon = line.indexOf(':');
        return [line.slice(0, colon), line.slice(colon + 1)];
      })
  );
  const file = fields.get('SF');
  if (!file?.startsWith('src/') || file.includes('/__tests__/')) continue;
  if (covered.has(file)) throw new Error(`Duplicate coverage input: ${file}`);
  covered.add(file);
  for (const metric of Object.keys(totals)) {
    const value = Number(fields.get(metric));
    if (!Number.isInteger(value) || value < 0) throw new Error(`Invalid ${metric} for ${file}`);
    totals[metric] += value;
  }
}
function hasRuntimeCode(file) {
  const source = ts.createSourceFile(file, readFileSync(`${root}${file}`, 'utf8'), ts.ScriptTarget.Latest);
  return source.statements.some((statement) => {
    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) return false;
    if (ts.isImportDeclaration(statement)) return !statement.importClause?.isTypeOnly;
    if (ts.isExportDeclaration(statement)) return !statement.isTypeOnly;
    return !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword);
  });
}
const missing = readdirSync(`${root}src`, { recursive: true })
  .map((file) => `src/${file}`)
  .filter((file) => /\.tsx?$/.test(file) && !file.endsWith('.d.ts') && !file.includes('/__tests__/'))
  .filter((file) => !covered.has(file) && hasRuntimeCode(file))
  .sort();
if (!totals.LF || !totals.FNF || totals.LH > totals.LF || totals.FNH > totals.FNF) throw new Error('Invalid or empty engine coverage report');
const lines = totals.LH / totals.LF,
  functions = totals.FNH / totals.FNF;
console.log(`Measured engine source: ${(lines * 100).toFixed(2)}% lines, ${(functions * 100).toFixed(2)}% functions (${covered.size} modules).`);
// Use weighted LCOV totals and require every runtime module; an average of file percentages can
// hide a large untested module. Generated wasm-bindgen code is checked through Rust/WASM tests.
const failures = [];
if (missing.length) failures.push(`${missing.length} runtime modules missing from coverage:\n${missing.join('\n')}`);
if (lines < 0.97 || functions < 0.95) failures.push('Engine coverage requires 97% lines and 95% functions');
if (failures.length) throw new Error(failures.join('\n'));
