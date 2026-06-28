import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import chalk from 'chalk';

const VALID_KEYS = ['timezone', 'no-color', 'no-emoji'] as const;
type ConfigKey = (typeof VALID_KEYS)[number];

interface ConfigMap {
  timezone: string;
  'no-color': boolean;
  'no-emoji': boolean;
}

const DEFAULTS: ConfigMap = {
  timezone: 'local',
  'no-color': false,
  'no-emoji': false,
};

function getConfigDir(): string {
  return join(homedir(), '.hermes', 'f1-cli');
}

function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

function loadConfig(): Partial<ConfigMap> {
  const path = getConfigPath();
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as Partial<ConfigMap>;
  } catch {
    return {};
  }
}

function saveConfig(config: Partial<ConfigMap>): void {
  const dir = getConfigDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(join(dir, 'config.json'), JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function isValidKey(key: string): key is ConfigKey {
  return (VALID_KEYS as readonly string[]).includes(key);
}

function formatValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function configCommand(subcommand: string | undefined, key?: string, value?: string): void {
  if (subcommand !== 'set' && subcommand !== 'get') {
    console.log(chalk.red(`Unknown subcommand: ${subcommand ?? '(none)'}`));
    console.log(chalk.dim('Usage: f1 config set <key> <value>'));
    console.log(chalk.dim('       f1 config get <key>'));
    console.log();
    console.log(chalk.dim('Valid keys: ') + VALID_KEYS.join(', '));
    process.exit(1);
  }

  if (!key) {
    console.log(chalk.red('Missing key.'));
    console.log(chalk.dim('Usage: f1 config set <key> <value>'));
    console.log(chalk.dim('       f1 config get <key>'));
    console.log();
    console.log(chalk.dim('Valid keys: ') + VALID_KEYS.join(', '));
    process.exit(1);
  }

  if (!isValidKey(key)) {
    console.log(chalk.red(`Invalid key: ${key}`));
    console.log(chalk.dim('Valid keys: ') + VALID_KEYS.join(', '));
    process.exit(1);
  }

  const config = loadConfig();

  if (subcommand === 'get') {
    const stored = config[key];
    const val = stored !== undefined ? stored : DEFAULTS[key];
    console.log(`${key} = ${formatValue(val)}`);
  } else {
    // set
    if (value === undefined || value === '') {
      console.log(chalk.red('Missing value.'));
      console.log(chalk.dim(`Usage: f1 config set <key> <value>`));
      process.exit(1);
    }

    // Parse value based on key type
    let parsedValue: ConfigMap[ConfigKey];
    if (key === 'no-color' || key === 'no-emoji') {
      if (value === 'true' || value === '1' || value === 'yes') {
        parsedValue = true;
      } else if (value === 'false' || value === '0' || value === 'no') {
        parsedValue = false;
      } else {
        console.log(chalk.red(`Invalid boolean value: ${value}`));
        console.log(chalk.dim('Use: true, false, yes, no, 1, 0'));
        process.exit(1);
      }
    } else {
      parsedValue = value;
    }

    (config as Record<string, string | boolean>)[key] = parsedValue;
    saveConfig(config);
    console.log(chalk.green(`Set ${key} = ${formatValue(parsedValue)}`));
  }
}
