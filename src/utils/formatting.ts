import chalk from 'chalk';
import Table from 'cli-table3';

type TableInstance = InstanceType<typeof Table>;

// -- Color palette --
const F1_RED = '#e10600';
const GOLD = '#ffd700';
const SILVER = '#a8a8a8';
const BRONZE = '#cd7f32';

/**
 * Apply a team color to a driver name using chalk.hex().
 * Handles colors with or without a # prefix.
 */
function colorDriver(name: string, color?: string): string {
  if (!color) return name;
  const hex = color.startsWith('#') ? color : '#' + color;
  return chalk.hex(hex)(name);
}

// -- Terminal width --

/**
 * Detect the current terminal width, with a sensible fallback.
 * Returns Infinity in non-TTY environments (tests, piped output) so
 * table scaling is a no-op and ideal widths are used as-is.
 */
export function getTerminalWidth(): number {
  if (!process.stdout.isTTY) return Infinity;
  return process.stdout.columns && process.stdout.columns > 0
    ? process.stdout.columns
    : 80;
}

// -- Helpers --

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
 * Convert an ISO date string to the user's local timezone for display.
 *
 * Parsing the ISO string as a Date and reading getHours()/getMinutes()/getDay()
 * already returns local-time values -- the JS runtime handles the conversion.
 * The gmtOffset parameter is kept for backwards compatibility but is NOT used
 * in the calculation. The previous implementation double-counted by adding both
 * the circuit offset and the local timezone offset.
 *
 * Returns a readable format like "Sat, 15 Mar 2025, 15:30"
 */
export function formatSessionTime(dateStart: string, _gmtOffset?: string): string {
  const d = new Date(dateStart);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const day = days[d.getDay()];
  const date = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');

  return `${day}, ${date} ${month} ${year}, ${hours}:${mins}`;
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
 * Format gap to leader -- could be a number (seconds) or a string (laps down).
 */
export function formatGap(gap: number | string | null): string {
  if (gap === null || gap === undefined) return '-';
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

// -- Country flag emoji --

/**
 * Mapping of 3-letter IOC country codes (as returned by the OpenF1 API) to
 * 2-letter ISO 3166-1 alpha-2 codes, used to build flag emoji.
 */
const IOC_TO_ISO: Record<string, string> = {
  GBR: 'GB', NED: 'NL', MON: 'MC', GER: 'DE', ESP: 'ES', FRA: 'FR',
  AUS: 'AU', CAN: 'CA', ITA: 'IT', BRA: 'BR', MEX: 'MX', JPN: 'JP',
  CHN: 'CN', FIN: 'FI', DEN: 'DK', SWE: 'SE', NOR: 'NO', BEL: 'BE',
  USA: 'US', NZL: 'NZ', THA: 'TH', RSA: 'ZA', SUI: 'CH', AUT: 'AT',
  ARG: 'AR', POR: 'PT',
};

/**
 * Convert a 2-letter ISO code to a flag emoji using regional indicator symbols.
 */
function isoToFlag(iso: string): string {
  if (iso.length !== 2) return '';
  const upper = iso.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '';
  const A = 0x1f1e6;
  const c1 = A + (upper.charCodeAt(0) - 65);
  const c2 = A + (upper.charCodeAt(1) - 65);
  return String.fromCodePoint(c1) + String.fromCodePoint(c2);
}

/**
 * Convert a 3-letter IOC country code (or a 2-letter ISO code) to a flag
 * emoji. Returns an empty string for unknown codes.
 */
export function countryCodeToFlag(code: string): string {
  if (!code) return '';
  const upper = code.toUpperCase();
  // If it is already a 2-letter code, use it directly
  if (upper.length === 2 && /^[A-Z]{2}$/.test(upper)) return isoToFlag(upper);
  // Otherwise look up the IOC -> ISO mapping
  const iso = IOC_TO_ISO[upper];
  if (!iso) return '';
  return isoToFlag(iso);
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

// -- Horizontal bar chart --

/**
 * Build a proportional horizontal bar using block characters.
 * Filled portions use \u2588, empty portions use \u2591.
 * The bar width is proportional to points/maxPoints, clamped to [0, maxWidth].
 * Colored with the given team color (hex with or without #), or F1 red by default.
 */
export function makeBar(points: number, maxPoints: number, maxWidth: number, color?: string): string {
  if (maxWidth <= 0) return '';
  if (maxPoints <= 0 || points <= 0) {
    const empty = '\u2591'.repeat(maxWidth);
    return chalk.gray(empty);
  }
  const ratio = Math.min(points / maxPoints, 1);
  const filled = Math.round(ratio * maxWidth);
  const empty = maxWidth - filled;
  const hex = color ? (color.startsWith('#') ? color : '#' + color) : F1_RED;
  const bar = chalk.hex(hex)('\u2588'.repeat(filled)) + chalk.gray('\u2591'.repeat(empty));
  return bar;
}

// -- Countdown timer --

/**
 * Format a countdown from now to a target date.
 * - "Starts in Xm" if under 1 hour
 * - "Starts in Xh Ym" if under 1 day
 * - "Starts in Xd Yh" if over 1 day
 * - "Started" if the target is already in the past
 */
export function formatCountdown(targetDate: Date, now: Date = new Date()): string {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) return 'Started';
  const totalMins = Math.floor(diffMs / 60_000);
  const totalHours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  if (totalMins < 60) {
    return `Starts in ${totalMins}m`;
  }
  if (totalHours < 24) {
    const mins = totalMins % 60;
    return `Starts in ${totalHours}h ${mins}m`;
  }
  const hours = totalHours % 24;
  return `Starts in ${days}d ${hours}h`;
}

/**
 * Return a blinking red "LIVE" indicator using ANSI escape codes.
 * Uses blink (SGR 5) + red (SGR 31).
 */
export function liveIndicator(): string {
  return '\x1b[5m\x1b[31mLIVE\x1b[0m';
}

// -- Color-coded gap to leader --

/**
 * Color a gap-to-leader string based on its value.
 * - "LEADER" -> gold bold
 * - gap under 5 seconds -> green
 * - gap 5-30 seconds -> yellow
 * - gap over 30 seconds or a string gap (lapped) -> red
 */
export function colorGap(gap: string, gapValue?: number): string {
  if (gap === '-') return chalk.dim(gap);
  if (gap === 'LEADER') return chalk.hex(GOLD).bold(gap);
  if (gapValue !== undefined && gapValue !== null && !Number.isNaN(gapValue)) {
    if (gapValue < 5) return chalk.green(gap);
    if (gapValue <= 30) return chalk.yellow(gap);
    return chalk.red(gap);
  }
  // String gap (e.g. "+1 LAP") or no numeric value -> red
  return chalk.red(gap);
}

// -- ASCII podium graphic --

/**
 * Render a compact ASCII podium for the top 3 finishers.
 * Driver last names are truncated to 10 characters. Names are colored with
 * team colors when provided. The 1st-place box sits centered above the
 * 2nd-place (left) and 3rd-place (right) boxes.
 */
export function createPodiumGraphic(
  top3: Array<{ position: number; driver: string; teamColor?: string }>
): string {
  // Find entries by position
  const p1 = top3.find((e) => e.position === 1);
  const p2 = top3.find((e) => e.position === 2);
  const p3 = top3.find((e) => e.position === 3);
  if (!p1 || !p2 || !p3) return '';

  const width = 10; // inner width of each box
  const pad = (s: string) => s.padEnd(width).slice(0, width);

  const name1 = pad(p1.driver.toUpperCase());
  const name2 = pad(p2.driver.toUpperCase());
  const name3 = pad(p3.driver.toUpperCase());

  const c1 = colorDriver(name1, p1.teamColor);
  const c2 = colorDriver(name2, p2.teamColor);
  const c3 = colorDriver(name3, p3.teamColor);

  const boxW = 12; // total box width including borders
  const top = '+----------+';
  const mid = (n: string) => `| ${n} |`;
  const bot = '+----------+';

  // Layout: lower row is [4 spaces][box][2 spaces][box] = 4+12+2+12 = 30 cols
  // Upper box (12 cols) centered: (30-12)/2 = 9 spaces indent
  const upperIndent = 9;
  const lowerIndent = 4;
  const gap = 2;

  // Label positions: center each 3-char label over its box
  const upperLabelCol = upperIndent + (boxW - 3) / 2; // 9 + 4.5 = 13 -> floor 14
  const leftLabelCol = lowerIndent + (boxW - 3) / 2;  // 4 + 4.5 = 8 -> floor 9
  const rightBoxCol = lowerIndent + boxW + gap;        // 4+12+2 = 18
  const rightLabelCol = rightBoxCol + (boxW - 3) / 2;  // 18+4.5 = 22 -> floor 23

  const sp = (n: number) => ' '.repeat(Math.floor(n));
  const labelLine2 = sp(leftLabelCol) + '2nd' + sp(rightLabelCol - leftLabelCol - 3) + '3rd';

  const lines: string[] = [
    '',
    sp(upperLabelCol) + '1st',
    sp(upperIndent) + top,
    sp(upperIndent) + mid(c1),
    sp(upperIndent) + bot,
    labelLine2,
    sp(lowerIndent) + top + sp(gap) + top,
    sp(lowerIndent) + mid(c2) + sp(gap) + mid(c3),
    sp(lowerIndent) + bot + sp(gap) + bot,
    '',
  ];

  return lines.join('\n');
}

// -- Table styling helpers --

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

/**
 * Given a set of column weights and a total terminal width, compute proportional
 * column widths that fit inside the terminal. Each weight is a relative share;
 * the minimum width for any column is 4 characters (plus borders).
 *
 * In non-TTY environments (tests, piped output) the weights are used as-is
 * so tables render at their ideal widths.
 */
function proportionalWidths(weights: number[], minWidth = 4): number[] {
  const termWidth = getTerminalWidth();
  if (termWidth === Infinity) return weights;
  // cli-table3 borders/padding consume roughly 1 char per column + 1 per separator
  const borderOverhead = weights.length + 1;
  const available = Math.max(termWidth - borderOverhead, weights.length * minWidth);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.max(minWidth, Math.floor((w / totalWeight) * available)));
}

// -- Table builders --

/**
 * Create a Table with no borders, no header separator, and minimal style.
 * Used when --compact mode is active.
 */
function createCompactTable(head: string[], colWidths?: number[]): TableInstance {
  return new Table({
    head,
    style: { head: [], border: [] },
    colWidths: colWidths ?? proportionalWidths([10, 30]),
    chars: {
      'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
      'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
      'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '',
      'right': '', 'right-mid': '', 'middle': ' ',
    },
  }) as unknown as TableInstance;
}

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
    teamColor?: string;
    countryCode?: string;
    gapValue?: number;
  }>,
  compact = false
): string {
  const head = ['Pos', 'Driver', 'Team', 'Laps', 'Time', 'Gap', 'Pts'];
  const weights = [5, 22, 20, 6, 10, 12, 5];
  const table: TableInstance = compact
    ? createCompactTable(head, proportionalWidths(weights))
    : new Table({
        head,
        style: { head: ['cyan'], border: ['gray'] },
        colWidths: proportionalWidths(weights),
      });

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const dnfLabel = r.dnf ? chalk.red(' DNF') : '';
    const flag = r.countryCode ? countryCodeToFlag(r.countryCode) : '';
    const driverName = flag ? `${flag} ${r.driver}` : r.driver;
    const coloredDriver = compact ? driverName : colorDriver(driverName, r.teamColor);
    const posStr = compact ? String(r.position) : colorPosition(r.position);
    const gapStr = compact ? r.gap : colorGap(r.gap, r.gapValue);
    const cells: string[] = [
      posStr,
      coloredDriver,
      r.team,
      String(r.laps),
      r.time + dnfLabel,
      gapStr,
      String(r.points),
    ];
    table.push(styleRow(cells, i));
  }

  if (compact) return table.toString();
  return headerBar() + chalk.dim('Results') + '\n' + table.toString();
}

/**
 * Create a table for championship standings.
 */
export function createStandingsTable(
  entries: Array<{
    position: number;
    name: string;
    points: number;
    change?: string;
    teamColor?: string;
  }>,
  title: string,
  compact = false
): string {
  const head = ['Pos', 'Name', 'Points', 'Bar', 'Chg'];
  const weights = [5, 28, 8, 14, 8];
  const table: TableInstance = compact
    ? createCompactTable(head, proportionalWidths(weights))
    : new Table({
        head,
        style: { head: ['cyan'], border: ['gray'] },
        colWidths: proportionalWidths(weights),
      });

  const maxPoints = entries.length > 0 ? entries[0].points : 0;
  const barMaxWidth = 12;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const changeStr = e.change || '-';
    const coloredName = compact ? e.name : colorDriver(e.name, e.teamColor);
    const bar = compact ? '' : makeBar(e.points, maxPoints, barMaxWidth, e.teamColor);
    const posStr = compact ? String(e.position) : colorPosition(e.position);
    const cells: string[] = [
      posStr,
      coloredName,
      String(e.points),
      bar,
      changeStr as string,
    ];
    table.push(styleRow(cells, i));
  }

  if (compact) return table.toString();
  const header = chalk.bold.cyan(`\n  ${title}\n`);
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
  }>,
  compact = false
): string {
  const head = ['#', 'Grand Prix', 'Location', 'Circuit', 'Qualifying', 'Race'];
  const weights = [3, 28, 18, 18, 24, 24];
  const table: TableInstance = compact
    ? createCompactTable(head, proportionalWidths(weights))
    : new Table({
        head,
        style: { head: ['cyan'], border: ['gray'] },
        colWidths: proportionalWidths(weights),
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

  if (compact) return table.toString();
  return headerBar() + chalk.dim('Upcoming') + '\n' + table.toString();
}

/**
 * Create a table for today's sessions (inline table, not imported from here normally).
 * Exported for the today command to use.
 */
export function createSessionTable(
  sessions: Array<{ name: string; dateTime: string; sessionType: string }>,
  compact = false
): string {
  const head = [chalk.cyan('Session'), chalk.cyan('Date'), chalk.cyan('Local Time')];
  const table: TableInstance = compact
    ? new Table({
        head: ['Session', 'Date', 'Local Time'],
        style: { head: [], border: [] },
        colWidths: proportionalWidths([24, 32, 16]),
        chars: {
          'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
          'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
          'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '',
          'right': '', 'right-mid': '', 'middle': ' ',
        },
      }) as unknown as TableInstance
    : new Table({
        head,
        style: { head: ['cyan'], border: ['gray'] },
        colWidths: proportionalWidths([24, 32, 16]),
      });

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const typeLabel = compact ? s.sessionType : colorSessionType(s.sessionType);
    const cells = [`${sessionTypeEmoji(s.sessionType)} ${s.name}`, s.dateTime, typeLabel];
    table.push(styleRow(cells, i));
  }

  if (compact) return table.toString();
  return headerBar() + chalk.dim('Sessions') + '\n' + table.toString();
}

/**
 * Create a table for driver info (bio + season stats).
 */
export function createDriverTable(
  driver: {
    name: string;
    number: number;
    team: string;
    teamColor?: string;
    countryCode: string | null;
    headshotUrl: string;
    seasonPoints: number;
    championshipPosition: number | null;
  },
  compact = false
): string {
  const table: TableInstance = compact
    ? new Table({
        style: { head: [], border: [] },
        colWidths: proportionalWidths([18, 40]),
        chars: {
          'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
          'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
          'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '',
          'right': '', 'right-mid': '', 'middle': ' ',
        },
      }) as unknown as TableInstance
    : new Table({
        style: { head: ['cyan'], border: ['gray'] },
        colWidths: proportionalWidths([18, 40]),
      });

  const flag = driver.countryCode ? countryCodeToFlag(driver.countryCode) : '';
  const nameDisplay = flag ? `${flag} ${driver.name}` : driver.name;
  const teamColor = driver.teamColor
    ? (driver.teamColor.startsWith('#') ? driver.teamColor : '#' + driver.teamColor)
    : '#ffffff';

  table.push(['Name', nameDisplay]);
  table.push(['Number', compact ? String(driver.number) : chalk.bold(String(driver.number))]);
  table.push(['Team', compact ? driver.team : chalk.hex(teamColor)(driver.team)]);
  table.push(['Nationality', driver.countryCode ?? '-']);
  table.push(['Headshot', driver.headshotUrl || '-']);
  table.push(['Season Points', compact ? String(driver.seasonPoints) : chalk.yellow(String(driver.seasonPoints))]);
  table.push(
    ['Championship Pos', driver.championshipPosition
      ? (compact ? String(driver.championshipPosition) : colorPosition(driver.championshipPosition))
      : '-']
  );

  if (compact) return table.toString();
  return headerBar() + chalk.dim('Driver') + '\n' + table.toString();
}
