import chalk from 'chalk';
import type { Command } from 'commander';
import { VERSION } from '../version.js';

const RED = '#e10600';
const CHECKERBOARD = chalk.hex(RED)('\u2588\u2588') + chalk.white('\u2588\u2588') + chalk.hex(RED)('\u2588\u2588') + chalk.white('\u2588\u2588');

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
 */
export function showHelp(program: Command): void {
  const commands = program.commands.map((cmd) => ({
    name: cmd.name(),
    description: cmd.description(),
  }));

  console.log(`  ${chalk.bold('Commands')}\n`);
  for (const c of commands) {
    const padded = c.name.padEnd(12);
    const label = c.name === 'last' ? chalk.yellow(padded) : chalk.cyan(padded);
    console.log(`    ${label}${chalk.dim(c.description)}`);
  }

  console.log(`\n  ${chalk.bold('Flags')}`);
  console.log(`    ${chalk.cyan('--help'.padEnd(12))}${chalk.dim('Show full help')}`);
  console.log(`    ${chalk.cyan('--version'.padEnd(12))}${chalk.dim('Show version')}`);
  console.log(`    ${chalk.cyan('--json'.padEnd(12))}${chalk.dim('Output raw JSON instead of tables')}`);
  console.log('\n');
}

/**
 * Print a trailing blank line so the shell prompt doesn't crowd output.
 */
export function printTrailingBlank(): void {
  console.log();
}
