import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Format a timezone offset string like "11:00:00" to a short label like "UTC+11"
 */
export function formatGmtOffset(gmtOffset: string): string {
  if (!gmtOffset) return 'UTC';
  // gmt_offset is like "03:00:00" or "-05:00:00"
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
  // gmtOffset is "HH:MM:SS" - parse the hours portion
  const offsetParts = gmtOffset.split(':');
  const offsetHours = parseInt(offsetParts[0], 10);
  const offsetMinutes = parseInt(offsetParts[1], 10);
  const totalOffsetMs = (offsetHours * 60 + (offsetHours < 0 ? -offsetMinutes : offsetMinutes)) * 60 * 1000;

  // Convert to local time by applying the offset
  const localTime = new Date(d.getTime() + totalOffsetMs + d.getTimezoneOffset() * 60000);

  // Build timezone abbreviation
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
 * Format gap to leader - could be a number (seconds) or a string (laps down).
 */
export function formatGap(gap: number | string): string {
  if (typeof gap === 'string') return gap; // "+1 LAP"
  if (gap === 0) return 'LEADER';
  return `+${gap.toFixed(1)}s`;
}

/**
 * Color a position number (top 3 get gold/silver/bronze).
 */
export function colorPosition(pos: number): string {
  if (pos === 1) return chalk.yellow.bold('1');
  if (pos === 2) return chalk.gray.bold('2');
  if (pos === 3) return chalk.rgb(205, 127, 50)('3');
  return String(pos);
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
  }>
): string {
  const table = new Table({
    head: ['Pos', 'Driver', 'Team', 'Laps', 'Time', 'Gap', 'Pts'],
    style: { head: ['cyan'], border: ['gray'] },
    colWidths: [5, 22, 20, 6, 10, 12, 5],
  });

  for (const r of results) {
    const dnfLabel = r.dnf ? chalk.red(' DNF') : '';
    table.push([
      colorPosition(r.position),
      r.driver,
      r.team,
      r.laps,
      r.time + dnfLabel,
      r.gap,
      r.points,
    ]);
  }

  return table.toString();
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
    colWidths: [5, 30, 10, 8],
  });

  for (const e of entries) {
    const changeStr = e.change || '-';
    table.push([colorPosition(e.position), e.name, String(e.points), changeStr]);
  }

  return header + table.toString();
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
    colWidths: [3, 28, 18, 18, 22, 22],
  });

  for (const r of races) {
    table.push([
      String(r.round),
      r.name,
      r.location,
      r.circuit,
      r.qualifyingDate,
      r.raceDate,
    ]);
  }

  return table.toString();
}
