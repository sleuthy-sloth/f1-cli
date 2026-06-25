import { api } from '../api/client.js';
import { createScheduleTable, formatSessionTime } from '../utils/formatting.js';
import chalk from 'chalk';

export async function scheduleCommand(): Promise<void> {
  const now = new Date();
  const currentYear = now.getFullYear();

  const [meetings, allSessions] = await Promise.all([
    api.getMeetings({ year: currentYear }),
    api.getSessions({ year: currentYear }),
  ]);

  const activeMeetings = meetings.filter((m) => !m.is_cancelled);

  // Find upcoming meetings (date_end is in the future or today)
  const upcoming = activeMeetings.filter((m) => new Date(m.date_end) > now);

  // If we have fewer than 5 upcoming, include the next one from next year
  let displayMeetings = upcoming.slice(0, 5);

  // For each meeting, find the Qualifying and Race sessions
  const races: Array<{
    round: number;
    name: string;
    location: string;
    raceDate: string;
    qualifyingDate: string;
    circuit: string;
  }> = displayMeetings.map((m, idx) => {
    const meetingSessions = allSessions.filter((s) => s.meeting_key === m.meeting_key);
    const qualy = meetingSessions.find(
      (s) => s.session_type === 'Qualifying' || s.session_type === 'Sprint Qualifying'
    );
    const race = meetingSessions.find((s) => s.session_type === 'Race');

    return {
      round: idx + 1,
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

  console.log(chalk.bold.cyan('\n  Upcoming F1 Races\n'));
  if (races.length === 0) {
    console.log('  No upcoming races found for the current season.');
    return;
  }
  console.log(createScheduleTable(races));
}
