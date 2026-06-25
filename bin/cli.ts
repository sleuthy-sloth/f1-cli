#!/usr/bin/env node

import { Command } from 'commander';
import { scheduleCommand } from '../src/commands/schedule.js';
import { resultsCommand } from '../src/commands/results.js';
import { standingsCommand } from '../src/commands/standings.js';
import { lastCommand } from '../src/commands/last.js';
import { todayCommand } from '../src/commands/today.js';
import { readFileSync } from 'node:fs';
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
);

const program = new Command();

program
  .name('f1')
  .description('Formula 1 data in your terminal')
  .version(version);

program
  .command('schedule')
  .description('Show the next 5 upcoming races with session times')
  .action(() => {
    scheduleCommand().catch((err: Error) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
  });

program
  .command('results')
  .description('Show race results for a given year and round (defaults to most recent)')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .argument('[round]', 'Round number (e.g. 1)', parseInt)
  .action((year?: number, round?: number) => {
    resultsCommand(year, round).catch((err: Error) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
  });

program
  .command('standings')
  .description('Show current driver and constructor championship standings')
  .argument('[year]', 'Year (e.g. 2025)', parseInt)
  .action((year?: number) => {
    standingsCommand(year).catch((err: Error) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
  });

program
  .command('last')
  .description('Show a quick summary of the most recent completed race')
  .action(() => {
    lastCommand().catch((err: Error) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
  });

program
  .command('today')
  .description('Show what is happening this race weekend')
  .action(() => {
    todayCommand().catch((err: Error) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
  });

program.parse();
