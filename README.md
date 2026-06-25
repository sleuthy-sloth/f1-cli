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
brew tap sleuthy-sloth/tap
brew install f1-cli
```

## Commands

```
f1 schedule          Show the next 5 upcoming races with session times
f1 results [y] [r]   Race results for a year/round (default: most recent)
f1 standings [year]  Driver + constructor championship standings
f1 last              Quick summary of the most recent completed race
f1 today             What's happening this race weekend
```

## Examples

Show the upcoming race calendar:

```bash
$ f1 schedule

Upcoming F1 Races

┌───┬────────────────────────────┬──────────────────┬──────────────────┬──────────────────────┬──────────────────────┐
│ # │ Grand Prix                 │ Location         │ Circuit          │ Qualifying           │ Race                 │
├───┼────────────────────────────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 1 │ Austrian Grand Prix        │ Spielberg        │ Spielberg        │ Sat, 28 Jun, 13:00   │ Sun, 29 Jun, 13:00   │
├───┼────────────────────────────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 2 │ British Grand Prix         │ Silverstone      │ Silverstone      │ Sat, 5 Jul, 16:00    │ Sun, 6 Jul, 15:00    │
├───┼────────────────────────────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 3 │ Belgian Grand Prix         │ Spa              │ Spa-Francorchamps│ Sat, 19 Jul, 13:00   │ Sun, 20 Jul, 13:00   │
├───┼────────────────────────────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 4 │ Hungarian Grand Prix       │ Budapest         │ Hungaroring      │ Sat, 26 Jul, 13:00   │ Sun, 27 Jul, 13:00   │
├───┼────────────────────────────┼──────────────────┼──────────────────┼──────────────────────┼──────────────────────┤
│ 5 │ Dutch Grand Prix           │ Zandvoort        │ Zandvoort        │ Sat, 23 Aug, 13:00   │ Sun, 24 Aug, 13:00   │
└───┴────────────────────────────┴──────────────────┴──────────────────┴──────────────────────┴──────────────────────┘
```

Check current championship standings:

```bash
$ f1 standings

2026 Formula 1 Championship Standings

Drivers Championship
┌─────┬──────────────────────────────┬──────────┬────────┐
│ Pos │ Name                         │ Points   │ Chg    │
├─────┼──────────────────────────────┼──────────┼────────┤
│ 1   │ Kimi ANTONELLI               │ 156      │ --     │
│ 2   │ Lewis HAMILTON               │ 115      │ --     │
│ 3   │ George RUSSELL               │ 106      │ --     │
│ 4   │ Charles LECLERC              │ 75       │ --     │
│ 5   │ Lando NORRIS                 │ 73       │ +1     │
│ ... │ (22 drivers total)           │          │        │
└─────┴──────────────────────────────┴──────────┴────────┘

Constructors Championship
┌─────┬──────────────────────────────┬──────────┬────────┐
│ Pos │ Name                         │ Points   │ Chg    │
├─────┼──────────────────────────────┼──────────┼────────┤
│ 1   │ Mercedes                     │ 262      │ --     │
│ 2   │ Ferrari                      │ 190      │ --     │
│ 3   │ McLaren                      │ 141      │ --     │
│ 4   │ Red Bull Racing              │ 89       │ --     │
│ ... │ (11 teams total)             │          │        │
└─────┴──────────────────────────────┴──────────┴────────┘
```

## Why

Existing F1 CLI tools are either abandoned or require paid API keys. The old Ergast API shut down in 2024, and most tools that relied on it stopped working. This tool uses the free OpenF1 API (historical data from 2023+) with no sign-up required.

Things this does differently:

- **Local timezone display.** Session times are converted to your local timezone automatically.
- **Table formatting.** Colored output with proper alignment, no JSON dumps.
- **Caching.** API responses are cached for 30-60 seconds so repeated calls don't hammer the API.
- **Rate limiting.** Built-in rate limiting keeps us polite to the free API.

## API

This tool uses the [OpenF1 API](https://openf1.org/) for all data. Historical data (2023+) is free and requires no authentication. Real-time data requires a paid subscription.

This is also Steven's first npm package -- built to learn the publish workflow end-to-end.

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
