import { api } from '../api/client.js';
import type { PrefetchedData } from '../api/client.js';
import { createScheduleTable, formatSessionTime } from '../utils/formatting.js';
import { printTrailingBlank } from '../utils/display.js';
import { Spinner } from '../utils/spinner.js';
import chalk from 'chalk';

export async function scheduleCommand(jsonMode = false, year?: number, compact = false, prefetchedData?: PrefetchedData): Promise<void> {
  const now = new Date();
  const currentYear = year ?? now.getFullYear();

  const [meetings, allSessions] = prefetchedData
    ? [prefetchedData.meetings, prefetchedData.sessions]
    : await Spinner.with('Fetching schedule', () =>
        Promise.all([
          api.getMeetings({ year: currentYear }),
          api.getSessions({ year: currentYear }),
        ])
      );

  // Sort meetings chronologically so we can derive real round numbers
  const activeMeetings = meetings
    .filter((m) => !m.is_cancelled)
    .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

  // Find upcoming meetings (date_end is in the future or today)
  // If a specific year is requested that isn't the current year, show all races
  const isCurrentYear = currentYear === now.getFullYear();
  const upcoming = isCurrentYear
    ? activeMeetings.filter((m) => new Date(m.date_end) > now)
    : activeMeetings;

  // If we have fewer than 5 upcoming (current year only), pad with next races
  const displayMeetings = isCurrentYear ? upcoming.slice(0, 5) : upcoming.slice(0, 5);

  // For each meeting, find the Qualifying and Race sessions
  // Round is derived from the meeting's 1-indexed position in the full year's list
  const races: Array<{
    round: number;
    name: string;
    location: string;
    raceDate: string;
    qualifyingDate: string;
    circuit: string;
  }> = displayMeetings.map((m) => {
    const realRound = activeMeetings.findIndex((am) => am.meeting_key === m.meeting_key) + 1;
    const meetingSessions = allSessions.filter((s) => s.meeting_key === m.meeting_key);
    const qualy = meetingSessions.find(
      (s) => s.session_type === 'Qualifying' || s.session_type === 'Sprint Qualifying'
    );
    const race = meetingSessions.find((s) => s.session_type === 'Race');

    return {
      round: realRound,
      name: m.meeting_name,
      location: m.location,
      circuit: m.circuit_short_name,
      qualifyingDate: qualy
        ? formatSessionTime(qualy.date_start, qualy.gmt_offset)
        : 'TBC',
      raceDate: race
        ? formatSessionTime(race.date_start, race.gmt_offset)
        : formatSessionTime(m.date_start, m.gmt_offset),
    };
  });

  if (races.length === 0) {
    if (jsonMode) {
      console.log(JSON.stringify({ races: [] }, null, 2));
      return;
    }
    console.log(chalk.dim('  No upcoming races found for the current season.\n'));
    return;
  }

  if (jsonMode) {
    console.log(JSON.stringify({
      year: currentYear,
      races: displayMeetings.map((m) => {
        const realRound = activeMeetings.findIndex((am) => am.meeting_key === m.meeting_key) + 1;
        const meetingSessions = allSessions.filter((s) => s.meeting_key === m.meeting_key);
        const qualy = meetingSessions.find(
          (s) => s.session_type === 'Qualifying' || s.session_type === 'Sprint Qualifying'
        );
        const race = meetingSessions.find((s) => s.session_type === 'Race');
        return {
          round: realRound,
          name: m.meeting_name,
          location: m.location,
          circuit: m.circuit_short_name,
          qualifyingDateUtc: qualy?.date_start ?? null,
          raceDateUtc: race?.date_start ?? m.date_start,
          gmtOffset: m.gmt_offset,
        };
      }),
    }, null, 2));
    return;
  }

  console.log(createScheduleTable(races, compact));
  printTrailingBlank();
}
