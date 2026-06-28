import * as readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import chalk from 'chalk';
import { VERSION } from './version.js';
import { parseNaturalLanguage } from './nlu.js';
import { scheduleCommand } from './commands/schedule.js';
import { resultsCommand } from './commands/results.js';
import { standingsCommand } from './commands/standings.js';
import { lastCommand } from './commands/last.js';
import { todayCommand } from './commands/today.js';
import { driverCommand } from './commands/driver.js';
import { circuitCommand } from './commands/circuit.js';
import { weekendCommand } from './commands/weekend.js';
import { lapsCommand } from './commands/laps.js';
import { compareCommand } from './commands/compare.js';
import { seasonCommand } from './commands/season.js';
import { configCommand } from './commands/config.js';

const RED = '#e10600';
const CHECKERBOARD =
  chalk.hex(RED)('\u2588\u2588') +
  chalk.white('\u2588\u2588') +
  chalk.hex(RED)('\u2588\u2588') +
  chalk.white('\u2588\u2588');

interface CommandDef {
  name: string;
  aliases: string[];
  args: string;
  description: string;
  usage: string;
  run: (args: string[], jsonMode: boolean) => Promise<void>;
}

const COMMANDS: CommandDef[] = [
  {
    name: 'schedule',
    aliases: ['sched'],
    args: '',
    description: 'Show the next 5 upcoming races with session times',
    usage: '/schedule',
    run: (_args, json) => scheduleCommand(json),
  },
  {
    name: 'standings',
    aliases: ['st'],
    args: '[year]',
    description: 'Show driver and constructor championship standings',
    usage: '/standings [year]',
    run: (args, json) => {
      const year = args[0] ? parseInt(args[0], 10) : undefined;
      return standingsCommand(year, json);
    },
  },
  {
    name: 'results',
    aliases: ['r'],
    args: '[year] [round]',
    description: 'Show race results (defaults to most recent)',
    usage: '/results [year] [round]',
    run: (args, json) => {
      const year = args[0] ? parseInt(args[0], 10) : undefined;
      const round = args[1] ? parseInt(args[1], 10) : undefined;
      return resultsCommand(year, round, json);
    },
  },
  {
    name: 'last',
    aliases: ['l'],
    args: '',
    description: 'Quick summary of the most recent completed race',
    usage: '/last',
    run: (_args, json) => lastCommand(json),
  },
  {
    name: 'today',
    aliases: ['t', 'next'],
    args: '',
    description: 'Show what is happening this race weekend',
    usage: '/today',
    run: (_args, json) => todayCommand(json),
  },
  {
    name: 'driver',
    aliases: ['d'],
    args: '[name]',
    description: 'Search for a driver by name and show bio + season stats',
    usage: '/driver verstappen',
    run: (args, json) => {
      const name = args.join(' ') || undefined;
      return driverCommand(name, json);
    },
  },
  {
    name: 'circuit',
    aliases: ['c', 'track'],
    args: '[name]',
    description: 'Show ASCII track map and circuit details',
    usage: '/circuit monza',
    run: (args, json) => {
      const name = args.join(' ') || undefined;
      return circuitCommand(name, json);
    },
  },
  {
    name: 'weekend',
    aliases: ['wknd', 'w'],
    args: '[year]',
    description: 'Visual timeline of the current or next race weekend',
    usage: '/weekend [year]',
    run: (args, json) => {
      const year = args[0] ? parseInt(args[0], 10) : undefined;
      return weekendCommand(year, json);
    },
  },
  {
    name: 'laps',
    aliases: ['lap'],
    args: '[year] [driver_number]',
    description: 'Show lap times from the most recent completed race',
    usage: '/laps [year] [driver_number]',
    run: (args, json) => {
      const year = args[0] ? parseInt(args[0], 10) : undefined;
      const driverNumber = args[1] ? parseInt(args[1], 10) : undefined;
      return lapsCommand(year, driverNumber, json);
    },
  },
  {
    name: 'compare',
    aliases: ['vs', 'head2head'],
    args: '<driver1> <driver2> [year]',
    description: 'Compare two drivers head-to-head',
    usage: '/compare verstappen hamilton',
    run: (args, json) => {
      const [d1, d2, yearStr] = args;
      const year = yearStr ? parseInt(yearStr, 10) : undefined;
      return compareCommand(d1, d2, year, json);
    },
  },
  {
    name: 'season',
    aliases: ['sea'],
    args: '[year]',
    description: 'Full championship summary with next race countdown',
    usage: '/season [year]',
    run: (args, json) => {
      const year = args[0] ? parseInt(args[0], 10) : undefined;
      return seasonCommand(year, json);
    },
  },
  {
    name: 'config',
    aliases: [],
    args: '<set|get> <key> [value]',
    description: 'Get or set config values (timezone, no-color, no-emoji)',
    usage: '/config get timezone',
    run: (args) => {
      configCommand(args[0], args[1], args[2]);
      return Promise.resolve();
    },
  },
];

function printBanner(): void {
  console.log();
  console.log(
    `  ${chalk.bold.hex(RED)('F1')} ${chalk.dim('--')} ${chalk.white('Formula 1 in your terminal')}`
  );
  console.log(`  ${CHECKERBOARD} ${chalk.dim('v' + VERSION)}`);
  console.log();
}

function printHelp(): void {
  console.log(`  ${chalk.bold('Interactive commands -- type any of these:')}`);
  console.log();

  const maxName = Math.max(...COMMANDS.map((c) => c.name.length));
  const maxAlias = Math.max(...COMMANDS.map((c) => c.aliases.join(', ').length));

  for (const c of COMMANDS) {
    const name = chalk.cyan(c.name.padEnd(maxName + 1));
    const aliasStr = c.aliases.length > 0 ? c.aliases.join(', ') : '';
    const aliases = chalk.dim(aliasStr.padEnd(maxAlias + 2));
    const args = c.args ? chalk.dim.italic(' ' + c.args) : '';
    const desc = chalk.dim(c.description);
    console.log(`    ${name}${aliases}${desc}${args}`);
  }

  console.log();
  console.log(`  ${chalk.bold('Other commands')}`);
  console.log(`    ${chalk.cyan('/help'.padEnd(maxName + 1))}${chalk.dim(' '.repeat(maxAlias + 2))}Show this help menu`);
  console.log(`    ${chalk.cyan('/clear'.padEnd(maxName + 1))}${chalk.dim(' '.repeat(maxAlias + 2))}Clear the screen`);
  console.log(`    ${chalk.cyan('/exit'.padEnd(maxName + 1))}${chalk.dim(' '.repeat(maxAlias + 2))}Quit the REPL`);
  console.log();
  console.log(`  ${chalk.bold('Tips')}`);
  console.log(`    ${chalk.dim('-- Commands work with or without / (e.g.')} ${chalk.cyan('/schedule')} ${chalk.dim('or')} ${chalk.cyan('schedule')}${chalk.dim(')')}`);
  console.log(`    ${chalk.dim('-- Ask questions in plain English, e.g.:')}`);
  console.log(`    ${chalk.dim('   ')}${chalk.cyan("what is piastri's gap to hamilton?")}`);
  console.log(`    ${chalk.dim('   ')}${chalk.cyan('how many points does verstappen have?')}`);
  console.log(`    ${chalk.dim('   ')}${chalk.cyan('who won the last race?')}`);
  console.log(`    ${chalk.dim('   ')}${chalk.cyan('leclerc vs sainz')}`);
  console.log(`    ${chalk.dim('-- Type a driver name to search (e.g.')} ${chalk.cyan('verstappen')}${chalk.dim(')')}`);
  console.log(`    ${chalk.dim('-- Add')} ${chalk.cyan('--json')} ${chalk.dim('to any command for raw JSON output')}`);
  console.log(`    ${chalk.dim('-- Press')} ${chalk.cyan('Tab')} ${chalk.dim('to autocomplete commands')}`);
  console.log(`    ${chalk.dim('-- Press')} ${chalk.cyan('Ctrl+C')} ${chalk.dim('or type')} ${chalk.cyan('/exit')} ${chalk.dim('to quit')}`);
  console.log();
}

function clearScreen(): void {
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
}

function findCommand(input: string): CommandDef | undefined {
  return COMMANDS.find(
    (c) => c.name === input || c.aliases.includes(input)
  );
}

// Tab completion for / commands
function completer(line: string): [string[], string] {
  if (line.startsWith('/')) {
    const partial = line.slice(1).split(' ')[0];
    if (!line.includes(' ')) {
      const matches: string[] = [];
      for (const c of COMMANDS) {
        if (c.name.startsWith(partial)) matches.push('/' + c.name);
        for (const a of c.aliases) {
          if (a.startsWith(partial)) matches.push('/' + a);
        }
      }
      // Add meta commands
      for (const meta of ['/help', '/clear', '/exit']) {
        if (meta.slice(1).startsWith(partial)) matches.push(meta);
      }
      return [matches, partial];
    }
  }
  return [[], line];
}

export async function startRepl(): Promise<void> {
  printBanner();
  printHelp();

  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
    prompt: chalk.hex(RED)(' f1> '),
    completer: completer as readline.Completer,
  });

  rl.prompt();

  rl.on('line', async (rawLine: string) => {
    const line = rawLine.trim();

    // Empty line -- just reprompt
    if (line.length === 0) {
      rl.prompt();
      return;
    }

    // Non-/ input -- check if it matches a command name or alias first
    if (!line.startsWith('/')) {
      const parts = line.split(/\s+/);
      const firstWord = parts[0].toLowerCase();
      const cmd = findCommand(firstWord);
      if (cmd) {
        // It's a command alias typed without / -- run it
        const jsonMode = parts.includes('--json');
        const cleanArgs = parts.slice(1).filter((a) => a !== '--json');
        await runCommand([cmd.name, ...cleanArgs], rl, jsonMode);
      } else {
        // Try natural language parsing before falling back to driver search
        const nluResult = await parseNaturalLanguage(line, false);
        if (nluResult) {
          if (nluResult.handled) {
            // NLU handler already produced output
          } else if (nluResult.command) {
            // NLU mapped to a command -- run it
            await runCommand([nluResult.command, ...nluResult.args], rl, false);
          }
        } else {
          // No NLU match -- treat as driver search
          await runCommand(['driver', line], rl);
        }
      }
      rl.prompt();
      return;
    }

    // Parse /command args...
    const parts = line.slice(1).split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Strip --json flag from args if present
    const jsonMode = args.includes('--json');
    const cleanArgs = args.filter((a) => a !== '--json');

    // Meta commands
    if (cmdName === 'exit' || cmdName === 'quit') {
      console.log(chalk.dim('\n  See you at the races. \u{1F3C1}\n'));
      rl.close();
      process.exit(0);
    }

    if (cmdName === 'help' || cmdName === '?' || cmdName === 'h') {
      printHelp();
      rl.prompt();
      return;
    }

    if (cmdName === 'clear' || cmdName === 'cls') {
      clearScreen();
      printBanner();
      rl.prompt();
      return;
    }

    // F1 data commands
    const cmd = findCommand(cmdName);
    if (cmd) {
      await runCommand([cmd.name, ...cleanArgs], rl, jsonMode);
      rl.prompt();
      return;
    }

    // Unknown command
    console.log(chalk.red(`\n  Unknown command: /${cmdName}`));
    console.log(chalk.dim('  Type /help to see available commands.\n'));
    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

async function runCommand(
  parts: string[],
  _rl: readline.Interface,
  jsonMode = false
): Promise<void> {
  const cmdName = parts[0];
  const args = parts.slice(1);

  try {
    const cmd = findCommand(cmdName);
    if (cmd) {
      await cmd.run(args, jsonMode);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('ENOTFOUND') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ETIMEDOUT') ||
      message.includes('429')
    ) {
      console.error(chalk.red('\n  Could not reach the F1 API.'));
      if (message.includes('429')) {
        console.error(chalk.yellow('  Rate limited -- wait a few seconds and try again.\n'));
      } else {
        console.error(chalk.yellow('  Check your internet connection and try again.\n'));
      }
    } else {
      console.error(chalk.red(`\n  ${message}\n`));
    }
  }
}
