import { fileURLToPath } from 'node:url';

const archive = 'packages/website/scripts/nayan-ui-games.tgz';
const lockfile = 'bun.lock';
const root = fileURLToPath(new URL('..', import.meta.url));

function git(...args: string[]) {
  const result = Bun.spawnSync(['git', ...args], { cwd: root, stdout: 'pipe', stderr: 'pipe' });
  if (!result.success) throw new Error(result.stderr.toString().trim());
  return result.stdout;
}

function stagedFile(path: string) {
  const result = Bun.spawnSync(['git', 'show', `:${path}`], { cwd: root, stdout: 'pipe', stderr: 'ignore' });
  if (!result.success) throw new Error(`Stage ${path} with the games archive update.`);
  return result.stdout;
}

try {
  if (git('diff', '--cached', '--name-only', '--', archive, lockfile).length) {
    const lock = Bun.JSON5.parse(stagedFile(lockfile).toString()) as { packages?: Record<string, unknown[]> };
    const expected = lock.packages?.['@nayan-ui/games']?.at(-1);
    const actual = `sha512-${new Bun.CryptoHasher('sha512').update(stagedFile(archive)).digest('base64')}`;
    if (expected !== actual) {
      throw new Error(
        'The staged games archive does not match the staged bun.lock. Run bun update --cwd=packages/website --ignore-scripts @nayan-ui/games, then stage both files.'
      );
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
