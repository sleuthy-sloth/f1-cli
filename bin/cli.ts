#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { scheduleCommand } from '../src/commands/schedule.js';
import { resultsCommand } from '../src/commands/results.js';
import { standingsCommand } from '../src/commands/standings.js';
import { lastCommand } from '../src/commands/last.js';
import { todayCommand } from '../src/commands/today.js';
import { VERSION } from '../src/version.js';
import { showBanner, showHelp } from '../src/utils/display.js';

const program = new Command();

program
  .name('f1')
  .description('Formula 1 data in your terminal')
  .version(VERSION)
  .action(() => {
    showBanner();
    showHelp(program);
  });

program
  .command('schedule')
  .description('Show the next 5 upcoming races with session times')
  .action(() => {
    scheduleCommand().catch(handleError);
  });

program
  .command('results')
  .description('Show race results for a given year and round (defaults to most recent)')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .argument('[round]', 'Round number (e.g. 1)', parseInt)
  .action((year?: number, round?: number) => {
    resultsCommand(year, round).catch(handleError);
  });

program
  .command('standings')
  .description('Show current driver and constructor championship standings')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .action((year?: number) => {
    standingsCommand(year).catch(handleError);
  });

program
  .command('last')
  .description('Show a quick summary of the most recent completed race')
  .action(() => {
    lastCommand().catch(handleError);
  });

program
  .command('today')
  .description('Show what is happening this race weekend')
  .action(() => {
    todayCommand().catch(handleError);
  });

function handleError(err: Error): void {
  // Network/fetch errors — show a human-friendly message
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
