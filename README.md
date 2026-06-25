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

### From source

```bash
git clone https://github.com/sleuthy-sloth/f1-cli.git
cd f1-cli
npm install
npm run build
npm link
```

## Quick start

```
$ f1 schedule

  Upcoming F1 Races

┌─────┬──────────────────────────────┬──────────────────┬──────────────────┬──────────────────────┬──────────────────────┐
│ #   │ Grand Prix                    │ Location         │ Circuit          │ Qualifying           │ Race                 │
├─────┼──────────────────────────────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 1   │ British Grand Prix            │ Silverstone      │ Silverstone      │ Sat, 5 Jul 2025      │ Sun, 6 Jul 2025      │
│     │                              │                  │                  │ 15:00 UTC+1          │ 15:00 UTC+1          │
├─────┼──────────────────────────────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 2   │ Hungarian Grand Prix          │ Budapest         │ Hungaroring      │ Sat, 19 Jul 2025     │ Sun, 20 Jul 2025     │
│     │                              │                  │                  │ 15:00 UTC+2          │ 15:00 UTC+2          │
├─────┼──────────────────────────────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 3   │ Belgian Grand Prix            │ Spa              │ Spa-Francorchamps│ Sat, 26 Jul 2025     │ Sun, 27 Jul 2025     │
│     │                              │                  │                  │ 15:00 UTC+2          │ 15:00 UTC+2          │
├─────┼──────────────────────────────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 4   │ Dutch Grand Prix              │ Zandvoort        │ Zandvoort        │ Sat, 2 Aug 2025      │ Sun, 3 Aug 2025      │
│     │                              │                  │                  │ 15:00 UTC+2          │ 15:00 UTC+2          │
├─────┼──────────────────────────────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 5   │ Italian Grand Prix            │ Monza            │ Monza            │ Sat, 6 Sep 2025      │ Sun, 7 Sep 2025      │
│     │                              │                  │                  │ 15:00 UTC+2          │ 15:00 UTC+2          │
└─────┴──────────────────────────────┴──────────────────┴──────────────────┴──────────────────────┴──────────────────────┘
```

```
$ f1 last

  Last Race: FORMULA 1 AWS GRAND PRIX DU CANADA 2025

  Winner: Lando Norris (McLaren)
  Time:   1:35
  2nd:    Max Verstappen (Red Bull Racing)
  3rd:    Charles Leclerc (Ferrari)

  Top 10:

┌──────┬──────────────────────┬────────────────────┬───────┬────────────┬──────────────┬───────┐
│ Pos  │ Driver               │ Team               │ Laps  │ Time       │ Gap          │ Pts   │
├──────┼──────────────────────┼────────────────────┼───────┼────────────┼──────────────┼───────┤
│ 1    │ Lando Norris         │ McLaren            │ 70    │ 1:35       │ LEADER       │ 25    │
│ 2    │ Max Verstappen       │ Red Bull Racing    │ 70    │ 1:35       │ +4.5s        │ 18    │
│ 3    │ Charles Leclerc      │ Ferrari            │ 70    │ 1:35       │ +8.2s        │ 15    │
│ 4    │ Oscar Piastri        │ McLaren            │ 70    │ 1:35       │ +12.1s       │ 12    │
│ 5    │ George Russell       │ Mercedes           │ 70    │ 1:35       │ +15.3s       │ 10    │
│ 6    │ Lewis Hamilton       │ Ferrari            │ 70    │ 1:35       │ +18.7s       │ 8     │
│ 7    │ Pierre Gasly         │ Alpine             │ 70    │ 1:35       │ +22.4s       │ 6     │
│ 8    │ Carlos Sainz         │ Williams           │ 70    │ 1:35       │ +26.1s       │ 4     │
│ 9    │ Fernando Alonso      │ Aston Martin       │ 70    │ 1:35       │ +30.5s       │ 2     │
│ 10   │ Alex Albon           │ Williams           │ 70    │ 1:35       │ +35.2s       │ 1     │
└──────┴──────────────────────┴────────────────────┴───────┴────────────┴──────────────┴───────┘
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
  is in progress, or the next upcoming race if there's a gap.
```

## Examples

```bash
# See the next 5 races
f1 schedule

# Get the most recent race results
f1 results

# Get results for a specific round
f1 results 2025 3

# Check championship standings
f1 standings

# Quick look at the last race
f1 last

# What's on this weekend
f1 today
```

## Why

The Ergast API -- the de facto free F1 data API for over a decade -- shut down at the end of 2024. Existing F1 CLI tools either relied on Ergast (now broken) or require paid API keys. This project replaces them with a tool that uses the new OpenF1 API, which provides free access to historical data (2023 onwards) with no sign-up required.

This is also my first npm package -- built to learn the publish workflow end-to-end.

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
