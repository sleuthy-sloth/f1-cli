# f1-cli

Formula 1 data in your terminal. Schedule, results, championship standings, and session times -- all from the command line.

Built on the [OpenF1 API](https://openf1.org/) (free, no auth required for historical data).

## Install

### npm (global)

```bash
npm install -g f1-cli
```

### npm (no install, one-off)

```bash
npx f1-cli schedule
```

### Homebrew

```bash
brew tap sleuthy-sloth/homebrew-tap
brew install f1-cli
```

## Commands

```
f1 schedule
  Show the next 5 upcoming races with session times in your local timezone.

f1 results [year] [round]
  Show race results for a given year and round. Defaults to the most recent
  completed race.

f1 standings [year]
  Show current driver and constructor championship standings. Defaults to the
  current season. Position change (+X/-X) shows movement since the previous race.

f1 last
  Quick summary of the most recent completed race -- winner, top 3, and full
  top-10 results table.

f1 today
  What's happening this race weekend. Shows upcoming sessions if a race weekend
  is in progress, or the next upcomming race if there's a gap.
```

## Examples

```bash
# See the next 5 races
$ f1 schedule

# Get the most recent race results
$ f1 results

# Get results for a specific round
$ f1 results 2025 3

# Check championship standings
$ f1 standings

# Quick look at the last race
$ f1 last

# What's on this weekend
$ f1 today
```

## Why

Existing F1 CLI tools are either abandoned or require paid API keys. f1-cli uses the free OpenF1 API (historical data from 2023+) with no sign-up required. It's also my first npm package -- built to learn the publish workflow end-to-end.

Things this does differently:

- **Local timezone display.** Session times are converted to your local timezone automatically.
- **Table formatting.** Colored output with proper alignment, no JSON dumps.
- **Caching.** API responses are cached for 30-60 seconds so repeated calls don't hammer the API.
- **Rate limiting.** Built-in rate limiting keeps us polite to the free API.

## API

This tool uses the [OpenF1 API](https://openf1.org/) for all data. Historical data (2023+) is free and requires no authentication. Real-time data requires a paid subscription.

## Development

```bash
git clone https://github.com/sleuthy-sloth/f1-cli.git
cd f1-cli
npm install
npm run dev    # run with tsx (no build needed)
npm run build  # compile TypeScript
npm test       # run tests
```

## License

MIT
