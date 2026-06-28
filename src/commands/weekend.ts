import { api } from '../api/client.js';
import type { PrefetchedData } from '../api/client.js';
import { Spinner } from '../utils/spinner.js';
import { printTrailingBlank } from '../utils/display.js';
import { formatSessionTime, colorSessionType, sessionTypeEmoji } from '../utils/formatting.js';
import chalk from 'chalk';

/**
 * Render a horizontal timeline bar for a session within the weekend.
 * Shows the session as a colored block proportional to its duration
 * within the total weekend span.
 */
function renderTimeline(
  sessions: Array<{ session_type: string; date_start: string; date_end: string }>,
  weekStart: number,
  weekEnd: number,
  barWidth: number
): string {
  const totalDuration = weekEnd - weekStart;
  if (totalDuration <= 0) return '';

  const lines: string[] = [];

  for (const s of sessions) {
    const sStart = new Date(s.date_start).getTime();
    const sEnd = new Date(s.date_end).getTime();
    const offset = ((sStart - weekStart) / totalDuration) * barWidth;
    const width = Math.max(1, ((sEnd - sStart) / totalDuration) * barWidth);

    const pad = ' '.repeat(Math.floor(offset));
    const blockChar = sessionBlockChar(s.session_type);
    const block = coloredBlock(blockChar, Math.floor(width), s.session_type);

    lines.push(`  ${pad}${block}`);
  }

  return lines.join('\n');
}

function sessionBlockChar(type: string): string {
  switch (type) {
    case 'Race':
      return '\u2588';
    case 'Qualifying':
    case 'Sprint Qualifying':
    case 'Sprint Shootout':
      return '\u2593';
    case 'Sprint':
      return '\u2592';
    case 'Practice':
      return '\u2591';
    default:
      return '\u2591';
  }
}

function coloredBlock(char: string, width: number, type: string): string {
  if (width <= 0) return '';
  const str = char.repeat(width);
  switch (type) {
    case 'Race':
      return chalk.hex('#e10600')(str);
    case 'Qualifying':
    case 'Sprint Qualifying':
    case 'Sprint Shootout':
      return chalk.hex('#ffff00')(str);
    case 'Sprint':
      return chalk.hex('#ff8c00')(str);
    case 'Practice':
      return chalk.hex('#569cd6')(str);
    default:
      return chalk.gray(str);
  }
}

function sessionDurationMin(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function formatMin(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export async function weekendCommand(year?: number, jsonMode = false, compact = false, prefetchedData?: PrefetchedData): Promise<void> {
  const now = new Date();
  const currentYear = year ?? now.getFullYear();

  const meetings = prefetchedData?.meetings
    ?? await Spinner.with('Fetching meetings', () => api.getMeetings({ year: currentYear }));
  const activeMeetings = meetings.filter((m) => !m.is_cancelled);

  // Find the current weekend (happening now) or next upcoming
  let target = activeMeetings.find((m) => {
    const start = new Date(m.date_start);
    const end = new Date(m.date_end);
    // Allow showing the weekend up to 2 days before and 1 day after
    const windowStart = new Date(start);
    windowStart.setDate(windowStart.getDate() - 2);
    const windowEnd = new Date(end);
    windowEnd.setDate(windowEnd.getDate() + 1);
    return now >= windowStart && now <= windowEnd;
  });

  if (!target) {
    // Find next meeting within 14 days
    target = activeMeetings.find((m) => {
      const start = new Date(m.date_start);
      const diffDays = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 0 && diffDays <= 14;
    });
  }

  if (!target) {
    // Fall back to next meeting regardless
    target = activeMeetings.find((m) => new Date(m.date_start) > now);
  }

  if (!target) {
    if (jsonMode) {
      console.log(JSON.stringify({ status: 'no-upcoming' }, null, 2));
    } else {
      console.log(chalk.dim('\n  No upcoming race weekends found.\n'));
    }
    return;
  }

  const sessions = prefetchedData?.sessions?.filter((s) => s.meeting_key === target!.meeting_key)
    ?? await Spinner.with('Fetching sessions', () => api.getSessions({ meeting_key: target!.meeting_key }));

  if (jsonMode) {
    console.log(JSON.stringify({
      meeting: target.meeting_name,
      location: target.location,
      date_start: target.date_start,
      date_end: target.date_end,
      sessions: sessions.map((s) => ({
        type: s.session_type,
        name: s.session_name,
        date_start: s.date_start,
        date_end: s.date_end,
        duration_min: sessionDurationMin(s.date_start, s.date_end),
      })),
    }, null, 2));
    return;
  }

  const weekStart = new Date(target.date_start).getTime();
  const weekEnd = new Date(target.date_end).getTime();
  const totalMin = (weekEnd - weekStart) / 60000;

  if (compact) {
    // Compact: just list sessions
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const emoji = sessionTypeEmoji(s.session_type);
      const timeStr = formatSessionTime(s.date_start, s.gmt_offset);
      console.log(`  ${emoji} ${timeStr}  ${s.session_type}`);
    }
    printTrailingBlank();
    return;
  }

  console.log(chalk.bold.cyan(`\n  ${target.meeting_name}\n`));
  console.log(`  ${chalk.dim(target.location)}`);
  console.log(`  ${formatSessionTime(target.date_start, target.gmt_offset)} ${chalk.dim('--')} ${formatSessionTime(target.date_end, target.gmt_offset)}`);
  console.log(`  ${chalk.dim('Total duration:')} ${formatMin(totalMin)}\n`);

  // Timeline
  const barWidth = 48;
  console.log(renderTimeline(sessions, weekStart, weekEnd, barWidth));
  console.log();

  // Legend
  console.log(`  ${chalk.dim('Legend:')} ${chalk.hex('#e10600')('\u2588 Race')}  ${chalk.hex('#ffff00')('\u2593 Qualifying')}  ${chalk.hex('#ff8c00')('\u2592 Sprint')}  ${chalk.hex('#569cd6')('\u2591 Practice')}`);
  console.log();

  // Session list with gaps
  console.log(`  ${chalk.bold('Session Breakdown')}\n`);

  let prevEnd: number | null = null;

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const sStart = new Date(s.date_start).getTime();
    const sEnd = new Date(s.date_end).getTime();
    const dur = sessionDurationMin(s.date_start, s.date_end);

    // Gap between sessions
    if (prevEnd !== null) {
      const gapMin = (sStart - prevEnd) / 60000;
      if (gapMin > 15) {
        const gapBarLen = Math.max(1, Math.round((gapMin / totalMin) * barWidth));
        console.log(`  ${' '.repeat(20)}${chalk.dim('\u2500'.repeat(gapBarLen) + ` gap ${formatMin(gapMin)}`)}`);
      }
    }

    const emoji = sessionTypeEmoji(s.session_type);
    const typeLabel = colorSessionType(s.session_type);
    const timeStr = formatSessionTime(s.date_start, s.gmt_offset);
    const durStr = chalk.dim(`(${formatMin(dur)})`);

    console.log(`  ${emoji} ${timeStr}  ${typeLabel}  ${durStr}`);

    prevEnd = sEnd;
  }

  printTrailingBlank();
}
