import chalk from 'chalk';
import Table from 'cli-table3';

// ── Color palette ──────────────────────────────────────────────
const F1_RED = '#e10600';
const GOLD = '#ffd700';
const SILVER = '#a8a8a8';
const BRONZE = '#cd7f32';

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Format a timezone offset string like "11:00:00" to a short label like "UTC+11"
 */
export function formatGmtOffset(gmtOffset: string): string {
  if (!gmtOffset) return 'UTC';
  const parts = gmtOffset.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const sign = hours >= 0 ? '+' : '';
  if (minutes === 0) return `UTC${sign}${hours}`;
  return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Convert an ISO date string + GMT offset to locale-friendly display.
 * Returns a readable format like "Sat, 15 Mar 2025, 15:30 AEDT"
 */
export function formatSessionTime(dateStart: string, gmtOffset: string): string {
  const d = new Date(dateStart);
  const offsetParts = gmtOffset.split(':');
  const offsetHours = parseInt(offsetParts[0], 10);
  const offsetMinutes = parseInt(offsetParts[1], 10);
  const totalOffsetMs =
    (offsetHours * 60 + (offsetHours < 0 ? -offsetMinutes : offsetMinutes)) * 60 * 1000;

  const localTime = new Date(d.getTime() + totalOffsetMs + d.getTimezoneOffset() * 60000);

  const tzSign = offsetHours >= 0 ? '+' : '';
  const tzLabel = `${tzSign}${String(Math.abs(offsetHours)).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const day = days[localTime.getDay()];
  const date = localTime.getDate();
  const month = months[localTime.getMonth()];
  const year = localTime.getFullYear();
  const hours = String(localTime.getHours()).padStart(2, '0');
  const mins = String(localTime.getMinutes()).padStart(2, '0');

  return `${day}, ${date} ${month} ${year}, ${hours}:${mins} UTC${tzLabel}`;
}

/**
 * Format a duration in seconds to a human-readable time string.
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(Math.round(secs)).padStart(2, '0')}`;
}

/**
 * Format gap to leader — could be a number (seconds) or a string (laps down).
 */
export function formatGap(gap: number | string): string {
  if (typeof gap === 'string') return gap;
  if (gap === 0) return 'LEADER';
  return `+${gap.toFixed(1)}s`;
}

/**
 * Color a position number with medal emoji for podium positions.
 * Top 3 get gold/silver/bronze emoji + color, others get plain number.
 */
export function colorPosition(pos: number): string {
  if (pos === 1) return `\u{1F947} ${chalk.hex(GOLD).bold(String(pos))}`;
  if (pos === 2) return `\u{1F948} ${chalk.hex(SILVER).bold(String(pos))}`;
  if (pos === 3) return `\u{1F949} ${chalk.hex(BRONZE).bold(String(pos))}`;
  return String(pos);
}

/**
 * Return a colored label for a session type.
 */
export function colorSessionType(type: string): string {
  switch (type) {
    case 'Race':
      return chalk.hex('#00ff41').bold('Race');
    case 'Qualifying':
    case 'Sprint Qualifying':
    case 'Sprint Shootout':
      return chalk.hex('#ffff00')('Qualifying');
    case 'Practice':
      return chalk.hex('#569cd6')('Practice');
    case 'Sprint':
      return chalk.hex('#ff8c00')('Sprint');
    default:
      return type;
  }
}

/**
 * Get a compact emoji label for a session type (used in tables).
 */
export function sessionTypeEmoji(type: string): string {
  switch (type) {
    case 'Race':
      return '\u{1F3C1}'; // checkered flag
    case 'Qualifying':
    case 'Sprint Qualifying':
    case 'Sprint Shootout':
      return '\u23F1'; // stopwatch
    case 'Practice':
      return '\u{1F4DD}'; // memo
    case 'Sprint':
      return '\u26A1'; // lightning
    default:
      return '\u25CF'; // bullet
  }
}

// ── Table styling helpers ──────────────────────────────────────

/**
 * A subtle horizontal rule to place above tables.
 */
function headerBar(): string {
  return chalk.hex(F1_RED)('\u2500'.repeat(4)) + ' ';
}

/**
 * Apply alternating-row dimming: even rows get dimmed.
 */
function styleRow<T>(row: T[], index: number): T[] {
  if (index % 2 === 1) {
    return row.map((cell) => (typeof cell === 'string' ? chalk.dim(cell) : cell)) as unknown as T[];
  }
  return row;
}

// ── Table builders ─────────────────────────────────────────────

/**
 * Create a colored table for race results.
 */
export function createResultsTable(
  results: Array<{
    position: number;
    driver: string;
    team: string;
    laps: number;
    time: string;
    gap: string;
    points: number;
    dnf?: boolean;
  }>
): string {
  const table = new Table({
    head: ['Pos', 'Driver', 'Team', 'Laps', 'Time', 'Gap', 'Pts'],
    style: { head: ['cyan'], border: ['gray'] },
    colWidths: [7, 22, 20, 6, 10, 12, 5],
  });

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const dnfLabel = r.dnf ? chalk.red(' DNF') : '';
    const cells: string[] = [
      colorPosition(r.position),
      r.driver,
      r.team,
      String(r.laps),
      r.time + dnfLabel,
      r.gap,
      String(r.points),
    ];
    table.push(styleRow(cells, i));
  }

  return headerBar() + chalk.dim('Results') + '\n' + table.toString();
}

/**
 * Create a table for championship standings.
 */
export function createStandingsTable(
  entries: Array<{ position: number; name: string; points: number; change?: string }>,
  title: string
): string {
  const header = chalk.bold.cyan(`\n  ${title}\n`);
  const table = new Table({
    head: ['Pos', 'Name', 'Points', 'Chg'],
    style: { head: ['cyan'], border: ['gray'] },
    colWidths: [7, 30, 10, 8],
  });

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const changeStr = e.change || '-';
    const cells: string[] = [colorPosition(e.position), e.name, String(e.points), changeStr as string];
    table.push(styleRow(cells, i));
  }

  return header + '  ' + headerBar() + chalk.dim(title) + '\n' + table.toString();
}

/**
 * Create a schedule table for upcoming races.
 */
export function createScheduleTable(
  races: Array<{
    round: number;
    name: string;
    location: string;
    raceDate: string;
    qualifyingDate: string;
    circuit: string;
  }>
): string {
  const table = new Table({
    head: ['#', 'Grand Prix', 'Location', 'Circuit', 'Qualifying', 'Race'],
    style: { head: ['cyan'], border: ['gray'] },
    colWidths: [5, 28, 18, 18, 22, 22],
  });

  for (let i = 0; i < races.length; i++) {
    const r = races[i];
    const cells: string[] = [
      String(r.round),
      r.name,
      r.location,
      r.circuit,
      r.qualifyingDate,
      r.raceDate,
    ];
    table.push(styleRow(cells, i));
  }

  return headerBar() + chalk.dim('Upcoming') + '\n' + table.toString();
}

/**
 * Create a table for today's sessions (inline table, not imported from here normally).
 * Exported for the today command to use.
 */
export function createSessionTable(
  sessions: Array<{ name: string; dateTime: string; sessionType: string }>
): string {
  const table = new Table({
    head: [chalk.cyan('Session'), chalk.cyan('Date'), chalk.cyan('Local Time')],
    style: { head: ['cyan'], border: ['gray'] },
    colWidths: [24, 32, 16],
  });

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const typeLabel = colorSessionType(s.sessionType);
    const cells = [`${sessionTypeEmoji(s.sessionType)} ${s.name}`, s.dateTime, typeLabel];
    table.push(styleRow(cells, i));
  }

  return headerBar() + chalk.dim('Sessions') + '\n' + table.toString();
}
