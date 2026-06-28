# Changelog

## [0.2.0] - 2026-06-28

### New Commands
- `compare <driver1> <driver2>` - Head-to-head driver comparison showing teams, positions, points, and position changes
- `ask <question>` - Natural language queries from CLI mode (e.g., `f1 ask "who won the last race?"`)
- `season [year]` - Full championship summary with drivers, constructors, and next race countdown
- `laps [year] [driver_number]` - Lap times from the most recent completed race
- `config <set|get> [key] [value]` - Manage preferences (timezone, no-color, no-emoji)
- `weekend` / `wknd` - Visual timeline of the race weekend with proportional session blocks and gaps

### Enhanced Commands
- `--year` flag added to `schedule`, `last`, and `weekend` commands
- `--watch` flag on `today`/`next` - polls every 15 seconds and re-renders during live sessions
- `--compact` flag on all table commands - outputs raw tables without headers, titles, or decorative borders

### Visual Enhancements
- **Team-colored driver names** in all tables using actual F1 team hex codes (Ferrari red, McLaren orange, Mercedes cyan, Red Bull blue)
- **Country flag emojis** next to every driver name via IOC 3-letter to ISO 2-letter mapping (26 countries)
- **Color-coded gap-to-leader** - green (<5s), yellow (5-30s), red (>30s or lapped)
- **ASCII podium graphic** showing top 3 finishers before results tables
- **Inline proportional bar charts** in standings showing each driver's points relative to the leader
- **Circuit track maps** redesigned with Unicode box-drawing characters, DRS zone highlighting (cyan), sector markers (yellow), elevation arrows, compass rose, famous section names in magenta, and decorative double-line border
- **Speed gradient indicators** on circuit maps (▓ slow corners, ▒ medium, ░ fast straights)

### Interactive REPL Improvements
- Natural language query support - ask questions like "what is piastri's gap to hamilton?" or "leclerc vs sainz"
- Tab completion for all commands and aliases
- Shared API data prefetching - meetings and sessions fetched once at startup, not per-command
- Command aliases (`st` for standings, `r` for results, `l` for last, etc.)
- New commands in REPL: `compare`, `ask`, `season`, `laps`, `config`, `weekend`

### API & Performance
- Retry logic with exponential backoff on network errors, HTTP 429 (rate limit), and HTTP 503
- Prefetch cache for REPL mode eliminates redundant API calls
- TTL cache (30-60s) on all API responses
- Rate limiting to stay within OpenF1 API limits

### All Commands
| Command | Description |
|---------|-------------|
| `schedule [year]` | Next 5 upcoming races with session times |
| `results [year] [round]` | Race results with podium graphic, team colors, flags, gap coloring |
| `standings [year]` | Championship standings with bar charts and position changes |
| `last [year]` | Most recent race summary with podium graphic |
| `today --watch` | Current weekend with countdown timers, LIVE indicator, lap progress |
| `next` | Alias for `today` |
| `driver [name]` | Driver bio, team, stats with colored name and flag |
| `circuit [name]` | Detailed ASCII track map with corners, sectors, DRS, elevation |
| `weekend` / `wknd` | Visual timeline with proportional session blocks and gaps |
| `laps [year] [driver]` | Lap times from the most recent completed race |
| `compare <d1> <d2>` | Head-to-head driver comparison |
| `ask <question>` | Natural language query |
| `season [year]` | Full championship summary |
| `config <set|get>` | Manage user preferences |
| `repl` | Interactive REPL with all commands + natural language |

### Global Flags
- `--json` - Raw JSON output on all commands
- `--compact` - Minimal table output without headers or decorations
- `--watch` - Live polling mode (today/next only)
