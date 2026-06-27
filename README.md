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

──── Upcoming
┌─────┬────────────────────────────┬──────────────────┬──────────────────┬────────────────────────┬────────────────────────┐
│ #   │ Grand Prix                 │ Location         │ Circuit          │ Qualifying             │ Race                   │
├─────┼────────────────────────────┼──────────────────┼──────────────────┼────────────────────────┼────────────────────────┤
│ 10  │ Austrian Grand Prix        │ Spielberg        │ Spielberg        │ Sat, 27 Jun 2026, 16:… │ Sun, 28 Jun 2026, 15:… │
├─────┼────────────────────────────┼──────────────────┼──────────────────┼────────────────────────┼────────────────────────┤
│ 11  │ British Grand Prix         │ Silverstone      │ Silverstone      │ Fri, 3 Jul 2026, 16:30 │ Sat, 4 Jul 2026, 12:00 │
├─────┼────────────────────────────┼──────────────────┼──────────────────┼────────────────────────┼────────────────────────┤
│ 12  │ Belgian Grand Prix         │ Spa-Francorchamps│ Spa-Francorchamps│ Sat, 18 Jul 2026, 16:… │ Sun, 19 Jul 2026, 15:… │
├─────┼────────────────────────────┼──────────────────┼──────────────────┼────────────────────────┼────────────────────────┤
│ 13  │ Hungarian Grand Prix       │ Budapest         │ Hungaroring      │ Sat, 25 Jul 2026, 16:… │ Sun, 26 Jul 2026, 15:… │
├─────┼────────────────────────────┼──────────────────┼──────────────────┼────────────────────────┼────────────────────────┤
│ 14  │ Dutch Grand Prix           │ Zandvoort        │ Zandvoort        │ Fri, 21 Aug 2026, 16:… │ Sat, 22 Aug 2026, 12:… │
└─────┴────────────────────────────┴──────────────────┴──────────────────┴────────────────────────┴────────────────────────┘
```

```
$ f1 standings

  2026 Formula 1 Championship Standings

  Drivers Championship
  ──── Drivers Championship
┌───────┬──────────────────────────────┬──────────┬────────┐
│ Pos   │ Name                         │ Points   │ Chg    │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 🥇 1  │ Kimi ANTONELLI               │ 156      │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 🥈 2  │ Lewis HAMILTON               │ 115      │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 🥉 3  │ George RUSSELL               │ 106      │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 4     │ Charles LECLERC              │ 75       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 5     │ Lando NORRIS                 │ 73       │ +1     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 6     │ Oscar PIASTRI                │ 68       │ -1     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 7     │ Max VERSTAPPEN               │ 55       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 8     │ Pierre GASLY                 │ 41       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 9     │ Isack HADJAR                 │ 34       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 10    │ Liam LAWSON                  │ 28       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 11    │ Oliver BEARMAN               │ 18       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 12    │ Franco COLAPINTO             │ 16       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 13    │ Arvid LINDBLAD               │ 13       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 14    │ Carlos SAINZ                 │ 6        │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 15    │ Alexander ALBON              │ 5        │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 16    │ Esteban OCON                 │ 3        │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 17    │ Gabriel BORTOLETO            │ 2        │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 18    │ Fernando ALONSO              │ 1        │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 19    │ Nico HULKENBERG              │ 0        │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 20    │ Valtteri BOTTAS              │ 0        │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 21    │ Sergio PEREZ                 │ 0        │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 22    │ Lance STROLL                 │ 0        │ --     │
└───────┴──────────────────────────────┴──────────┴────────┘

  Constructors Championship
  ──── Constructors Championship
┌───────┬──────────────────────────────┬──────────┬────────┐
│ Pos   │ Name                         │ Points   │ Chg    │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 🥇 1  │ Mercedes                     │ 262      │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 🥈 2  │ Ferrari                      │ 190      │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 🥉 3  │ McLaren                      │ 141      │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 4     │ Red Bull Racing              │ 89       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 5     │ Alpine                       │ 57       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 6     │ Racing Bulls                 │ 41       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 7     │ Haas F1 Team                 │ 21       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 8     │ Williams                     │ 11       │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 9     │ Audi                         │ 2        │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 10    │ Aston Martin                 │ 1        │ --     │
├───────┼──────────────────────────────┼──────────┼────────┤
│ 11    │ Cadillac                     │ 0        │ --     │
└───────┴──────────────────────────────┴──────────┴────────┘
```

## Commands

### CLI mode

```
f1 schedule
  Show the next 5 upcoming races with session times in your local timezone.
  Rounds are labeled with their real season number (e.g., round 10 of 24).

f1 results [year] [round]
  Show race results for a given year and round. Defaults to the most recent
  completed race.

f1 standings [year]
  Show current driver and constructor championship standings. Defaults to the
  current season. Position change (+X/-X) shows movement since the previous
  race. Top 3 drivers and teams are marked with podium medals.

f1 last
  Quick summary of the most recent completed race -- winner, top 3, and full
  top-10 results table.

f1 today
  What's happening this race weekend. Shows upcoming sessions if a race weekend
  is in progress, or the next upcoming race if there's a gap.

f1 driver [name]
  Search for a driver by name (case-insensitive). Shows bio info, team,
  championship position, and season points.

f1 next
  Alias for "f1 today".

f1 repl
  Start the interactive REPL mode (see below).
```

### Interactive mode (REPL)

Run `f1` with no arguments, or `f1 repl`, to enter the interactive REPL. All commands are shown on startup so you never have to guess.

```
$ f1

  F1 -- Formula 1 in your terminal
  ████████ v0.1.0

  Interactive commands -- type any of these:

    schedule  sched    Show the next 5 upcoming races with session times
    standings st       Show driver and constructor championship standings [year]
    results   r        Show race results (defaults to most recent) [year] [round]
    last      l        Quick summary of the most recent completed race
    today     t, next  Show what is happening this race weekend
    driver    d        Search for a driver by name and show bio + season stats [name]

  Other commands
    /help              Show this help menu
    /clear             Clear the screen
    /exit              Quit the REPL

  Tips
    -- Type a command without / to search (e.g. verstappen)
    -- Add --json to any command for raw JSON output
    -- Press Tab to autocomplete commands
    -- Press Ctrl+C or type /exit to quit

 f1> /schedule
 f1> /standings 2025
 f1> /driver verstappen
 f1> verstappen          (no / needed for driver search)
 f1> /exit
```

Features:
- **Tab completion** -- type `/s` and press Tab to see matching commands
- **Command aliases** -- `/st` for standings, `/r` for results, `/l` for last, etc.
- **Driver search** -- type any driver name without `/` to search
- **--json in REPL** -- `/standings --json` works inside the REPL too
- **Always-visible help** -- all commands are listed on startup and via `/help`

## Visual features

All tabular output includes:

- **Header bars** — each table has a colored `────` bar above the title (F1 red), making sections easy to spot at a glance.
- **Podium medals** — 🥇🥈🥉 appear next to the top 3 positions in standings, results, and last race output.
- **Session type colors** — Race (green), Qualifying (yellow), Practice (blue), Sprint (orange) — each session type has its own color in schedule and today tables.
- **Session emoji** — each session row has an emoji icon: 🏁 (Race), ⏱ (Qualifying), 📝 (Practice), ⚡ (Sprint).
- **Alternating row dimming** — even-numbered rows are slightly dimmed so you can track lines across wide tables.
- **Upcoming header** — the schedule table has a `──── Upcoming` header that turns red when there are races to show.
- **Local timezone** — all session times are converted to your local time automatically. No more adding/subtracting UTC offsets.

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

Things this does differently:

- **Local timezone display.** Session times are converted to your local timezone automatically. No more manual UTC offset math.
- **Table formatting.** Colored output with proper alignment, emoji, and podium medals -- not raw JSON.
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
