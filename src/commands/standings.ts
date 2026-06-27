import { api } from '../api/client.js';
import { createStandingsTable } from '../utils/formatting.js';
import { printTrailingBlank } from '../utils/display.js';
import { Spinner } from '../utils/spinner.js';
import chalk from 'chalk';

export async function standingsCommand(year?: number, jsonMode = false): Promise<void> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();

  // Fetch all meetings and all sessions for the year in one call each
  const [meetings, allSessions] = await Spinner.with('Fetching standings', () =>
    Promise.all([
      api.getMeetings({ year: targetYear }),
      api.getSessions({ year: targetYear }),
    ])
  );

  const raceMeetings = meetings.filter((m) => !m.is_cancelled);

  let latestSessionKey: number | 'latest' = 'latest';
  let latestMeetingKey: number | 'latest' = 'latest';

  // Find the latest completed race session client-side (no N+1 loop)
  for (let i = raceMeetings.length - 1; i >= 0; i--) {
    const m = raceMeetings[i];
    const sessions = allSessions.filter((s) => s.meeting_key === m.meeting_key);
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
  const [standingsDrivers, standingsTeams, drivers] = await Spinner.with('Fetching championship', () =>
    Promise.all([
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
    ])
  );

  // Build driver number -> name lookup
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Sort drivers by current position
  const sortedDrivers = [...standingsDrivers].sort(
    (a, b) => a.position_current - b.position_current
  );

  const driverEntries = sortedDrivers.map((d) => {
    const driver = driverMap.get(d.driver_number);
    const name = driver?.full_name ?? `Driver #${d.driver_number}`;
    const teamColor = driver?.team_colour;
    const posChange = d.position_current - d.position_start;
    const changeStr =
      posChange === 0 ? '--' : posChange < 0 ? chalk.green(`+${Math.abs(posChange)}`) : chalk.red(`-${posChange}`);
    return {
      position: d.position_current,
      name,
      points: d.points_current,
      change: changeStr,
      teamColor,
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

  if (jsonMode) {
    console.log(JSON.stringify({
      year: targetYear,
      drivers: sortedDrivers.map((d) => {
        const driver = driverMap.get(d.driver_number);
        return {
          position: d.position_current,
          name: driver?.full_name ?? `Driver #${d.driver_number}`,
          team: driver?.team_name ?? 'Unknown',
          points: d.points_current,
          positionChange: d.position_start - d.position_current,
        };
      }),
      constructors: sortedTeams.map((t) => ({
        position: t.position_current,
        name: t.team_name,
        points: t.points_current,
        positionChange: t.position_start - t.position_current,
      })),
    }, null, 2));
    return;
  }

  console.log(chalk.bold(`\n  ${targetYear} Formula 1 Championship Standings\n`));
  console.log(createStandingsTable(driverEntries, 'Drivers Championship'));
  console.log(createStandingsTable(teamEntries, 'Constructors Championship'));
  printTrailingBlank();
}
