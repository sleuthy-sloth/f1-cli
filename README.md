# f1-cli -- Formula 1 in your terminal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Race results, championship standings, driver info, circuit maps, and session times -- all from the command line. No API keys, no sign-up, no browser.

Built on the [OpenF1 API](https://openf1.org/).

## Quick showoff

```
$ f1 last

  Last Race: Spanish Grand Prix

  Winner: Kimi ANTONELLI (Mercedes)
  Time:   1:32:45

      1st
      +----------+
      | ANTONELLI |
      +----------+
    2nd      3rd
  +----------+  +----------+
  | HAMILTON  |  | RUSSELL   |
  +----------+  +----------+

  Top 10:
  ──── Results
  ┌─────┬──────────────────────┬────────────────┬──────┬───────────┬────────────┬───────┐
  │ Pos │ Driver                │ Team           │ Laps │ Time      │ Gap        │ Pts   │
  ├─────┼──────────────────────┼────────────────┼──────┼───────────┼────────────┼───────┤
  │ 🥇 1 │ Kimi ANTONELLI        │ Mercedes       │ 66   │ 1:32:45   │ LEADER     │ 25    │
  │ 🥈 2 │ Lewis HAMILTON        │ Mercedes       │ 66   │ 1:32:52   │ +7.2s      │ 18    │
  │ 🥉 3 │ George RUSSELL        │ Mercedes       │ 66   │ 1:32:58   │ +13.4s     │ 15    │
  │ 4    │ Charles LECLERC       │ Ferrari        │ 66   │ 1:33:12   │ +27.1s     │ 12    │
  └─────┴──────────────────────┴────────────────┴──────┴───────────┴────────────┴───────┘
```

```
$ f1 weekend

  Spanish Grand Prix
  Barcelona, Spain
  Fri, 19 Jun 2026, 10:30 -- Sun, 21 Jun 2026, 18:00
  Total duration: 2d 7h 30m

  ██████████████████████████████████████████████████
  ░░░░░░░░░░░░░░░░░░██████████░░░░░░░░░░░░░░░░░░░░░░
  ░░░░░░░░░░░░███████████████████████████████░░░░░░░░
  ░░░░░░░░████████████████████████████████████████████
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████░░░░

  Legend: █ Race  ▓ Qualifying  ▒ Sprint  ░ Practice

  Session Breakdown

  🏁 Fri, 19 Jun 2026, 10:30  Practice (1h 0m)
  🏁 Fri, 19 Jun 2026, 11:30  Practice (1h 0m)
  ⏱ Sat, 20 Jun 2026, 11:00  Qualifying (1h 0m)
  🏁 Sun, 21 Jun 2026, 15:00  Race (2h 0m)
```

```
$ f1 standings

  2026 Formula 1 Championship Standings

  Drivers Championship
  ──── Drivers Championship
  ┌───────┬────────────────────────────┬──────────┬──────────────────┬────────┐
  │ Pos   │ Name                       │ Points   │ Bar              │ Chg    │
  ├───────┼────────────────────────────┼──────────┼──────────────────┼────────┤
  │ 🥇 1  │ Kimi ANTONELLI              │ 156      │ ████████████████ │ --     │
  │ 🥈 2  │ Lewis HAMILTON              │ 115      │ ████████████░░░░ │ --     │
  │ 🥉 3  │ George RUSSELL              │ 106      │ ███████████░░░░░ │ --     │
  │ 4     │ Charles LECLERC             │ 75       │ ███████░░░░░░░░░ │ --     │
  │ 5     │ Lando NORRIS                │ 73       │ ███████░░░░░░░░░ │ +1     │
  │ 6     │ Oscar PIASTRI               │ 68       │ █████░░░░░░░░░░░ │ -1     │
  │ 7     │ Max VERSTAPPEN              │ 55       │ █████░░░░░░░░░░░ │ --     │
  └───────┴────────────────────────────┴──────────┴──────────────────┴────────┘
```

```
$ f1 circuit suzuka

  Suzuka International Racing Course
  Japanese Grand Prix -- Suzuka, Japan

  Length:       5.807 km
  Turns:        18
  Direction:    Clockwise
  First GP:     1987
  Lap Record:   1:30.983 (Max Verstappen, 2023)

    +------+        +----------+
    |      |        |          |
    | S/F  |   +----+    +--+  |
    |      |   |         |  |  |
    +---+  +---+         |  |  |
        |                |  |  |
        |   +------------+  |  |
        |   |               |  |
        |   |    +------+   |  |
        |   |    |      |   |  |
        +---+----+      +---+  |
                       +------+
                          |
                     +----+
```

```
$ f1 today

  This Weekend: Spanish Grand Prix -- Barcelona, Spain

  ┌──────────────────────────────┬──────────────────────────────────┬──────────────────┐
  │ Session                      │ Date                             │ Local Time       │
  ├──────────────────────────────┼──────────────────────────────────┼──────────────────┤
  │ Practice 1 Starts in 10h 30m │ Fri, 19 Jun 2026                 │ 10:30            │
  │ Practice 2 Starts in 11h 30m │ Fri, 19 Jun 2026                 │ 11:30            │
  │ Qualifying Starts in 1d 11h  │ Sat, 20 Jun 2026                 │ 11:00            │
  │ Race Starts in 2d 15h        │ Sun, 21 Jun 2026                 │ 15:00            │
  └──────────────────────────────┴──────────────────────────────────┴──────────────────┘
```

## Install

```
npm install -g f1-cli
```

Or run without installing:

```
npx f1-cli schedule
```

### Homebrew

```
brew tap sleuthy-sloth/homebrew-tap
brew install f1-cli
```

### From source

```
git clone https://github.com/sleuthy-sloth/f1-cli.git
cd f1-cli
npm install
npm run build
npm link
```

## Commands

### CLI mode

```
f1 schedule       Next 5 races with session times in your local timezone

f1 results        Race results for a given year/round (defaults to most recent)
                  Driver names are team-colored using actual F1 hex codes.
                  Country flag emojis on every driver. Gap-to-leader is
                  color-coded (green < 5s, yellow 5-30s, red > 30s).
                  ASCII podium graphic for the top 3.

f1 standings      Driver and constructor championship standings with
                  inline proportional bar charts. Top 3 get podium medals.
                  Position change (+X/-X) since last race.

f1 last           Quick summary of the most recent completed race --
                  winner, top 3, podium graphic, and full top-10 table.

f1 today          What's happening this race weekend. Shows upcoming
                  sessions with countdown timers. Blinking LIVE indicator
                  when a session is active. Lap progress bar during the race.

f1 weekend        Visual timeline of the race weekend -- proportional
                  session blocks, gaps between sessions, session breakdown
                  with times and durations.

f1 driver         Search for a driver by name (case-insensitive). Shows
                  bio info, team, championship position, season points.
                  Team-colored name, flag emoji.

f1 circuit        ASCII art track maps for all 23 F1 circuits. Shows
                  circuit details -- length, turns, direction, lap record.
                  Matching works on short name, full name, or GP name.

f1 next           Alias for f1 today.

f1 repl           Interactive REPL mode (see below).
```

Add `--json` to any command for raw JSON output.

### Interactive REPL

Run `f1` with no arguments, or `f1 repl`, for the interactive REPL. All commands are shown on startup so you never have to guess what to type.

```
$ f1

  F1 -- Formula 1 in your terminal
  ████████ v0.1.0

  Interactive commands -- type any of these:

    schedule  sched    Show the next 5 upcoming races with session times
    standings st      Show driver and constructor championship standings [year]
    results   r       Show race results (defaults to most recent) [year] [round]
    last      l       Quick summary of the most recent completed race
    today     t, next Show what is happening this race weekend
    driver    d       Search for a driver by name and show bio + season stats [name]
    circuit   c, track Show ASCII track map and circuit details [name]

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
 f1> verstappen
 f1> /exit
```

Features:
- Tab completion -- type `/s` and press Tab to see matching commands
- Command aliases -- `/st` for standings, `/r` for results, `/l` for last
- Driver search -- type any driver name without `/` to search
- `--json` in REPL -- `/standings --json` works inside the REPL too
- Type `/help` anytime to see all commands

### Natural language queries

In the REPL, type questions in plain English:

```
f1> what is piastri's gap to hamilton?
f1> how many points does verstappen have?
f1> who won the last race?
f1> leclerc vs sainz
f1> when is the next race?
f1> show me the weekend schedule
```

The parser recognizes patterns for:
- Driver comparisons (X vs Y, gap between X and Y)
- Points queries (how many points does X have)
- Gap-to-leader queries
- Last race results (who won, last race)
- Next race / upcoming weekend
- Weekend timeline / session schedule
- Championship standings / leader

If a query doesn't match a known pattern, it falls through to driver search.

## What makes this different

The Ergast API -- the free F1 data API that powered most terminal tools for over a decade -- shut down at the end of 2024. Existing F1 CLI tools either relied on Ergast (now broken) or require paid API keys. This replaces them with a tool that uses the new OpenF1 API, providing free access to historical data (2023 onwards) with no sign-up required.

Things this does differently:

- **Local timezone display.** Session times convert to your local timezone automatically. No manual UTC offset math.
- **Table formatting.** Colored output with proper alignment, emoji, podium medals, and proportional bar charts -- not raw JSON.
- **Team colors.** Driver names and standings bars use actual F1 team hex codes (Mercedes cyan, Ferrari red, McLaren orange, etc.).
- **Country flag emojis.** Each driver's flag appears next to their name using IOC-to-ISO country code mapping (26 countries).
- **ASCII track maps.** Hand-crafted map art for all 23 circuits, with S/F line highlighted in F1 red.
- **Caching.** API responses are cached for 30-60 seconds so repeated calls don't hammer the API.
- **Rate limiting.** Built-in rate limiting keeps things polite to the free API.

## Visual features

Every table includes:

- **Podium medals** -- gold/silver/bronze emoji next to positions 1-3
- **Session type colors** -- Race (green), Qualifying (yellow), Practice (blue), Sprint (orange)
- **Session emoji** -- checkered flag for races, stopwatch for qualifying, memo for practice, lightning for sprint
- **Alternating row dimming** -- even rows are slightly dimmed so you can track lines across wide tables
- **F1 red header bars** -- each section is topped with a colored separator line

The `today` command also includes:
- **Countdown timers** -- "Starts in 1d 5h", "Starts in 30m"
- **Blinking LIVE indicator** -- animated during active sessions
- **Lap progress bar** -- shows current lap count during the race

The `weekend` command renders a full visual timeline:
- Proportional session blocks (█ Race, ▓ Qualifying, ▒ Sprint, ░ Practice)
- Gap indicators between sessions
- Complete session breakdown with durations

The `standings` command shows inline bar charts using block characters proportional to each driver's/team's points total relative to the leader.

## API

Uses the [OpenF1 API](https://openf1.org/) for all data. Historical data (2023+) is free with no authentication. Real-time data requires a paid subscription.

## Development

```
git clone https://github.com/sleuthy-sloth/f1-cli.git
cd f1-cli
npm install
npm run dev      # run with tsx (no build needed)
npm run build    # compile TypeScript
npm test         # run tests
```

## License

MIT
