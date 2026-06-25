import { api } from '../api/client.js';
import {
  createResultsTable,
  formatDuration,
  formatGap,
} from '../utils/formatting.js';
import chalk from 'chalk';

export async function lastCommand(): Promise<void> {
  const now = new Date();
  const currentYear = now.getFullYear();

  const meetings = await api.getMeetings({ year: currentYear });
  const raceMeetings = meetings.filter((m) => !m.is_cancelled);

  // Find the most recent completed race
  let lastRaceMeeting = null;
  let lastRaceSession = null;

  for (let i = raceMeetings.length - 1; i >= 0; i--) {
    const m = raceMeetings[i];
    const sessions = await api.getSessions({ meeting_key: m.meeting_key });
    const raceSession = sessions.find(
      (s) => s.session_type === 'Race' && new Date(s.date_end) < now
    );
    if (raceSession) {
      lastRaceMeeting = m;
      lastRaceSession = raceSession;
      break;
    }
  }

  // If no race this year completed, check previous year
  if (!lastRaceMeeting) {
    const prevMeetings = await api.getMeetings({ year: currentYear - 1 });
    const prevRaceMeetings = prevMeetings.filter((m) => !m.is_cancelled);
    for (let i = prevRaceMeetings.length - 1; i >= 0; i--) {
      const m = prevRaceMeetings[i];
      const sessions = await api.getSessions({ meeting_key: m.meeting_key });
      const raceSession = sessions.find((s) => s.session_type === 'Race');
      if (raceSession) {
        lastRaceMeeting = m;
        lastRaceSession = raceSession;
        break;
      }
    }
  }

  if (!lastRaceMeeting || !lastRaceSession) {
    console.error(chalk.red('No recent race results found.'));
    process.exit(1);
  }

  // Get results and drivers
  const [results, drivers] = await Promise.all([
    api.getSessionResults({ session_key: lastRaceSession.session_key }),
    api.getDrivers({ session_key: lastRaceSession.session_key }),
  ]);

  results.sort((a, b) => a.position - b.position);
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Quick summary
  const winner = driverMap.get(results[0]?.driver_number);
  const second = driverMap.get(results[1]?.driver_number);
  const third = driverMap.get(results[2]?.driver_number);

  console.log(chalk.bold.cyan(`\n  Last Race: ${lastRaceMeeting.meeting_official_name}\n`));

  if (winner) {
    console.log(`  Winner: ${chalk.yellow.bold(winner.full_name)} (${winner.team_name})`);
    if (results[0]?.duration) {
      console.log(`  Time:   ${formatDuration(results[0].duration)}`);
    }
  }
  if (second) {
    console.log(`  2nd:    ${chalk.gray(second.full_name)} (${second.team_name})`);
  }
  if (third) {
    console.log(`  3rd:    ${chalk.rgb(205, 127, 50)(third.full_name)} (${third.team_name})`);
  }

  // Full results table
  const tableResults = results.slice(0, 10).map((r) => {
    const driver = driverMap.get(r.driver_number);
    return {
      position: r.position,
      driver: driver?.full_name ?? `Driver #${r.driver_number}`,
      team: driver?.team_name ?? 'Unknown',
      laps: r.number_of_laps,
      time: formatDuration(r.duration),
      gap: formatGap(r.gap_to_leader),
      points: r.points,
      dnf: r.dnf,
    };
  });

  console.log(chalk.dim('\n  Top 10:\n'));
  console.log(createResultsTable(tableResults));
}
