import { api } from '../api/client.js';
import {
  createResultsTable,
  formatDuration,
  formatGap,
} from '../utils/formatting.js';
import chalk from 'chalk';

export async function resultsCommand(year?: number, round?: number): Promise<void> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();

  const meetings = await api.getMeetings({ year: targetYear });
  const raceMeetings = meetings.filter((m) => !m.is_cancelled);

  let targetMeeting;
  if (round !== undefined) {
    targetMeeting = raceMeetings[round - 1];
    if (!targetMeeting) {
      console.error(chalk.red(`Round ${round} not found for the ${targetYear} season.`));
      process.exit(1);
    }
  } else {
    // Find the most recent completed race
    // Working backwards through meetings to find one with completed race results
    for (let i = raceMeetings.length - 1; i >= 0; i--) {
      const m = raceMeetings[i];
      const sessions = await api.getSessions({ meeting_key: m.meeting_key });
      const raceSession = sessions.find(
        (s) => s.session_type === 'Race' && new Date(s.date_end) < now
      );
      if (raceSession) {
        targetMeeting = m;
        break;
      }
    }

    if (!targetMeeting) {
      // Fall back to latest meeting's race session
      targetMeeting = raceMeetings[raceMeetings.length - 1];
    }
  }

  // Get sessions for the target meeting
  const sessions = await api.getSessions({ meeting_key: targetMeeting.meeting_key });
  const raceSession = sessions.find((s) => s.session_type === 'Race');

  if (!raceSession) {
    console.error(chalk.red(`No race session found for ${targetMeeting.meeting_name}.`));
    process.exit(1);
  }

  // Get results and drivers
  const [results, drivers] = await Promise.all([
    api.getSessionResults({ session_key: raceSession.session_key }),
    api.getDrivers({ session_key: raceSession.session_key }),
  ]);

  // Sort by position
  results.sort((a, b) => a.position - b.position);

  // Create driver lookups
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  const tableResults = results.map((r) => {
    const driver = driverMap.get(r.driver_number);
    const teamName = driver?.team_name ?? 'Unknown';

    return {
      position: r.position,
      driver: driver ? driver.full_name : `Driver #${r.driver_number}`,
      team: teamName,
      laps: r.number_of_laps,
      time: formatDuration(r.duration),
      gap: formatGap(r.gap_to_leader),
      points: r.points,
      dnf: r.dnf,
    };
  });

  console.log(chalk.bold.cyan(`\n  ${targetMeeting.meeting_official_name}\n`));
  console.log(createResultsTable(tableResults));
}
