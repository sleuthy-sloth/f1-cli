#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { scheduleCommand } from '../src/commands/schedule.js';
import { resultsCommand } from '../src/commands/results.js';
import { standingsCommand } from '../src/commands/standings.js';
import { lastCommand } from '../src/commands/last.js';
import { todayCommand } from '../src/commands/today.js';
import { driverCommand } from '../src/commands/driver.js';
import { circuitCommand } from '../src/commands/circuit.js';
import { weekendCommand } from '../src/commands/weekend.js';
import { lapsCommand } from '../src/commands/laps.js';
import { compareCommand } from '../src/commands/compare.js';
import { askCommand } from '../src/commands/ask.js';
import { seasonCommand } from '../src/commands/season.js';
import { configCommand } from '../src/commands/config.js';
import { VERSION } from '../src/version.js';
import { startRepl } from '../src/repl.js';

const program = new Command();

// Global flags: stored on the program, each command checks them
let jsonMode = false;
let compactMode = false;

program
  .name('f1')
  .description('Formula 1 data in your terminal')
  .version(VERSION)
  .option('--json', 'Output raw JSON instead of formatted tables')
  .option('--compact', 'Output tables without headers, titles, or decorative borders')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    jsonMode = opts.json === true;
    compactMode = opts.compact === true;
  })
  .action(() => {
    // No subcommand given -- enter interactive REPL mode
    startRepl().catch(handleError);
  });

program
  .command('schedule')
  .description('Show the next 5 upcoming races with session times')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .action((year?: number) => {
    scheduleCommand(jsonMode, year, compactMode).catch(handleError);
  });

program
  .command('results')
  .description('Show race results for a given year and round (defaults to most recent)')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .argument('[round]', 'Round number (e.g. 1)', parseInt)
  .action((year?: number, round?: number) => {
    resultsCommand(year, round, jsonMode, compactMode).catch(handleError);
  });

program
  .command('standings')
  .description('Show current driver and constructor championship standings')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .action((year?: number) => {
    standingsCommand(year, jsonMode, compactMode).catch(handleError);
  });

program
  .command('last')
  .description('Show a quick summary of the most recent completed race')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .action((year?: number) => {
    lastCommand(jsonMode, year, compactMode).catch(handleError);
  });

program
  .command('today')
  .description('Show what is happening this race weekend')
  .option('--watch', 'Poll every 15 seconds and re-render')
  .action((opts: { watch?: boolean }) => {
    todayCommand(jsonMode, opts.watch, compactMode).catch(handleError);
  });

// Alias: "f1 next" does the same thing as "f1 today"
program
  .command('next')
  .description('Alias for "today" -- show what is happening this race weekend')
  .option('--watch', 'Poll every 15 seconds and re-render')
  .action((opts: { watch?: boolean }) => {
    todayCommand(jsonMode, opts.watch, compactMode).catch(handleError);
  });

program
  .command('driver [name]')
  .description('Search for a driver by name and show bio + season stats')
  .action((name?: string) => {
    driverCommand(name, jsonMode, compactMode).catch(handleError);
  });

program
  .command('circuit [name]')
  .description('Show ASCII track map and details for a circuit')
  .action((name?: string) => {
    circuitCommand(name, jsonMode).catch(handleError);
  });

program
  .command('weekend')
  .alias('wknd')
  .description('Show a visual timeline and breakdown of the current or next race weekend')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .action((year?: number) => {
    weekendCommand(year, jsonMode, compactMode).catch(handleError);
  });

// Interactive REPL mode
program
  .command('repl')
  .description('Start interactive mode with / commands, tab completion, and driver search')
  .action(() => {
    startRepl().catch(handleError);
  });

// Lap times command
program
  .command('laps')
  .description('Show lap times from the most recent completed race')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .argument('[driver_number]', 'Filter by driver number (e.g. 44)', parseInt)
  .action((year?: number, driverNumber?: number) => {
    lapsCommand(year, driverNumber, jsonMode, compactMode).catch(handleError);
  });

// Compare two drivers
program
  .command('compare')
  .description('Compare two drivers head-to-head (championship standings)')
  .argument('<driver1>', 'First driver name (e.g. verstappen)')
  .argument('<driver2>', 'Second driver name (e.g. hamilton)')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .action((driver1: string, driver2: string, year?: number) => {
    compareCommand(driver1, driver2, year, jsonMode, compactMode).catch(handleError);
  });

// Ask a natural-language question
program
  .command('ask')
  .description('Ask a question in plain English (same as REPL natural-language parsing)')
  .argument('<question>', 'Your question (e.g. "who won the last race?")')
  .action((question: string) => {
    askCommand(question).catch(handleError);
  });

// Season championship summary
program
  .command('season')
  .description('Show full championship summary with drivers, constructors, and next race countdown')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .action((year?: number) => {
    seasonCommand(year, jsonMode, compactMode).catch(handleError);
  });

// Config management
program
  .command('config')
  .description('Get or set configuration values (timezone, no-color, no-emoji)')
  .argument('<subcommand>', '"set" or "get"')
  .argument('[key]', 'Config key')
  .argument('[value]', 'Value (for set)')
  .action((subcommand: string, key?: string, value?: string) => {
    configCommand(subcommand, key, value);
  });

function handleError(err: Error): void {
  // Network/fetch errors -- show a human-friendly message
  if (
    err.message.includes('fetch') ||
    err.message.includes('network') ||
    err.message.includes('ENOTFOUND') ||
    err.message.includes('ECONNREFUSED') ||
    err.message.includes('ECONNRESET') ||
    err.message.includes('ETIMEDOUT') ||
    err.message.includes('aborted') ||
    err.cause instanceof Error &&
      (err.cause.message.includes('fetch') || err.cause.message.includes('network'))
  ) {
    console.error(chalk.red('\n  Could not reach the F1 API.'));
    console.error(chalk.yellow('  Check your internet connection and try again.\n'));
    process.exit(1);
  }

  // API-level errors (404, 500, etc.)
  console.error(chalk.red(`\n  ${err.message}\n`));
  process.exit(1);
}

// Catch unhandled promise rejections (e.g. fetch failures from Commander internals)
process.on('unhandledRejection', (reason: unknown) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  handleError(err);
});

program.parse();
