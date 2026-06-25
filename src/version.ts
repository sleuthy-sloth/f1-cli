import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

/** Application version, synced from package.json at runtime */
export const VERSION: string = pkg.version;
