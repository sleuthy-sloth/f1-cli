import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// From dist/src/ or dist/bin/, go up two levels to reach the project root
const pkgPath = join(__dirname, '..', '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

/** Application version, synced from package.json at runtime */
export const VERSION: string = pkg.version;
