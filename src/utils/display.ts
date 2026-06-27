import chalk from 'chalk';
import type { Command } from 'commander';
import { VERSION } from '../version.js';

const RED = '#e10600';
const CHECKERBOARD =
  chalk.hex(RED)('\u2588\u2588') +
  chalk.white('\u2588\u2588') +
  chalk.hex(RED)('\u2588\u2588') +
  chalk.white('\u2588\u2588');

/**
 * Print the F1-themed header banner (2 lines).
 */
export function showBanner(): void {
  console.log();
  console.log(`  ${chalk.bold.hex(RED)('F1')} ${chalk.dim('--')} ${chalk.white('Formula 1 in your terminal')}`);
  console.log(`  ${CHECKERBOARD} ${chalk.dim('v' + VERSION)}\n`);
}

/**
 * Print the compact help reference shown when `f1` is run with no arguments.
 * Shows all commands with examples so users know exactly what to type.
 */
export function showHelp(program: Command): void {
  const commands = program.commands
    .filter((cmd) => cmd.name() !== 'help')
    .map((cmd) => ({
      name: cmd.name(),
      description: cmd.description(),
    }));

  // Build example usage for each command
  const examples: Record<string, string> = {
    schedule: 'f1 schedule',
    standings: 'f1 standings 2025',
    results: 'f1 results 2025 3',
    last: 'f1 last',
    today: 'f1 today',
    next: 'f1 next',
    driver: 'f1 driver verstappen',
    circuit: 'f1 circuit monza',
    repl: 'f1 repl',
  };

  console.log(`  ${chalk.bold('Commands')}\n`);

  // Calculate max name width for alignment
  const maxName = Math.max(...commands.map((c) => c.name.length));

  for (const c of commands) {
    const name = chalk.cyan(c.name.padEnd(maxName + 2));
    const desc = chalk.dim(c.description);
    console.log(`    ${name}${desc}`);
  }

  console.log(`\n  ${chalk.bold('Examples')}\n`);
  for (const [cmd, example] of Object.entries(examples)) {
    if (commands.find((c) => c.name === cmd)) {
      console.log(`    ${chalk.dim('$')} ${chalk.green(example)}`);
    }
  }

  console.log(`\n  ${chalk.bold('Flags')}`);
  console.log(`    ${chalk.cyan('--help'.padEnd(maxName + 2))}${chalk.dim('Show full help')}`);
  console.log(`    ${chalk.cyan('--version'.padEnd(maxName + 2))}${chalk.dim('Show version')}`);
  console.log(`    ${chalk.cyan('--json'.padEnd(maxName + 2))}${chalk.dim('Output raw JSON instead of tables')}`);

  console.log(`\n  ${chalk.bold('Interactive mode')}`);
  console.log(`    ${chalk.dim('Run')} ${chalk.green('f1')} ${chalk.dim('or')} ${chalk.green('f1 repl')} ${chalk.dim('to start the interactive REPL.')}`);
  console.log(`    ${chalk.dim('Type')} ${chalk.cyan('/help')} ${chalk.dim('inside the REPL to see all / commands.')}`);
  console.log('\n');
}

/**
 * Print a trailing blank line so the shell prompt doesn't crowd output.
 */
export function printTrailingBlank(): void {
  console.log();
}
