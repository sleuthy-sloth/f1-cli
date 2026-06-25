import { api } from '../api/client.js';
import { createStandingsTable } from '../utils/formatting.js';
import chalk from 'chalk';

export async function standingsCommand(year?: number): Promise<void> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();

  // Get the latest race session for the year to get latest standings
  const meetings = await api.getMeetings({ year: targetYear });
  const raceMeetings = meetings.filter((m) => !m.is_cancelled);

  let latestSessionKey: number | 'latest' = 'latest';
  let latestMeetingKey: number | 'latest' = 'latest';

  // Try to find the latest completed race for meaningful standings
  for (let i = raceMeetings.length - 1; i >= 0; i--) {
    const m = raceMeetings[i];
    const sessions = await api.getSessions({ meeting_key: m.meeting_key });
    const raceSession = sessions.find(
      (s) => s.session_type === 'Race' && new Date(s.date_end) < now
    );
    if (raceSession) {
      latestSessionKey = raceSession.session_key;
      latestMeetingKey = m.meeting_key;
      break;
    }
  }

  // Get championship data and driver info
  const [standingsDrivers, standingsTeams, drivers] = await Promise.all([
    api.getChampionshipDrivers({
      session_key: latestSessionKey,
      meeting_key: latestMeetingKey,
    }),
    api.getChampionshipTeams({
      session_key: latestSessionKey,
      meeting_key: latestMeetingKey,
    }),
    api.getDrivers({
      session_key: typeof latestSessionKey === 'number' ? latestSessionKey : 'latest',
    }),
  ]);

  // Build driver number -> name lookup
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Sort drivers by current position
  const sortedDrivers = [...standingsDrivers].sort(
    (a, b) => a.position_current - b.position_current
  );

  const driverEntries = sortedDrivers.map((d) => {
    const driver = driverMap.get(d.driver_number);
    const name = driver?.full_name ?? `Driver #${d.driver_number}`;
    const posChange = d.position_current - d.position_start;
    const changeStr =
      posChange === 0 ? '--' : posChange < 0 ? chalk.green(`+${Math.abs(posChange)}`) : chalk.red(`-${posChange}`);
    return {
      position: d.position_current,
      name,
      points: d.points_current,
      change: changeStr,
    };
  });

  // Sort teams by current position
  const sortedTeams = [...standingsTeams].sort(
    (a, b) => a.position_current - b.position_current
  );

  const teamEntries = sortedTeams.map((t) => {
    const posChange = t.position_current - t.position_start;
    const changeStr =
      posChange === 0 ? '--' : posChange < 0 ? chalk.green(`+${Math.abs(posChange)}`) : chalk.red(`-${posChange}`);
    return {
      position: t.position_current,
      name: t.team_name,
      points: t.points_current,
      change: changeStr,
    };
  });

  console.log(chalk.bold(`\n  ${targetYear} Formula 1 Championship Standings\n`));
  console.log(createStandingsTable(driverEntries, 'Drivers Championship'));
  console.log(createStandingsTable(teamEntries, 'Constructors Championship'));
}
