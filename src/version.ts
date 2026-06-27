import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Find package.json by walking up from this file's location.
// Works whether we're running from src/ (via tsx) or dist/src/ (compiled).
function findPackageJson(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 5; i++) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error('Could not find package.json');
}

const pkgPath = findPackageJson(__dirname);
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

/** Application version, synced from package.json at runtime */
export const VERSION: string = pkg.version;
