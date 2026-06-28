import { api } from '../api/client.js';
import { createStandingsTable } from '../utils/formatting.js';
import { printTrailingBlank } from '../utils/display.js';
import { Spinner } from '../utils/spinner.js';
import chalk from 'chalk';

export async function seasonCommand(
  year?: number,
  jsonMode = false,
  compact = false
): Promise<void> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();

  // Fetch all meetings and all sessions for the year
  const [meetings, allSessions] = await Spinner.with('Fetching season data', () =>
    Promise.all([
      api.getMeetings({ year: targetYear }),
      api.getSessions({ year: targetYear }),
    ])
  );

  const raceMeetings = meetings.filter((m) => !m.is_cancelled);

  // Find the latest completed race session
  let latestSessionKey: number | 'latest' = 'latest';
  let latestMeetingKey: number | 'latest' = 'latest';
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

  // Build driver lookup
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

  // Find next race
  const nextRace = raceMeetings.find(
    (m) => new Date(m.date_start) > now
  );

  if (jsonMode) {
    const result: Record<string, unknown> = {
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
    };

    if (nextRace) {
      const sessions = allSessions
        .filter((s) => s.meeting_key === nextRace.meeting_key)
        .sort((a, b) => a.date_start.localeCompare(b.date_start));
      const countdownMs = new Date(nextRace.date_start).getTime() - now.getTime();
      const countdownDays = Math.ceil(countdownMs / (1000 * 60 * 60 * 24));
      result.nextRace = {
        name: nextRace.meeting_official_name,
        location: nextRace.location,
        country: nextRace.country_name,
        dateStart: nextRace.date_start,
        countdownDays,
        sessions: sessions.map((s) => ({
          type: s.session_type,
          date: s.date_start,
        })),
      };
    }

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Title
  if (!compact) {
    console.log(chalk.bold.cyan(`\n  ${targetYear} Formula 1 World Championship\n`));
  }

  // Drivers championship
  console.log(createStandingsTable(driverEntries, 'Drivers Championship', compact));

  // Constructors championship
  console.log(createStandingsTable(teamEntries, 'Constructors Championship', compact));

  // Next race countdown
  if (nextRace) {
    const countdownMs = new Date(nextRace.date_start).getTime() - now.getTime();
    const countdownDays = Math.ceil(countdownMs / (1000 * 60 * 60 * 24));
    const countdownHours = Math.ceil(countdownMs / (1000 * 60 * 60));
    const sessions = allSessions
      .filter((s) => s.meeting_key === nextRace.meeting_key)
      .sort((a, b) => a.date_start.localeCompare(b.date_start));

    if (!compact) {
      console.log(chalk.bold(`\n  Next Race: ${nextRace.meeting_official_name}`));
      console.log(chalk.dim(`  ${nextRace.location}, ${nextRace.country_name}`));
      console.log();
    }

    const countdownStr =
      countdownDays > 0
        ? chalk.yellow(`  ${countdownDays} day${countdownDays === 1 ? '' : 's'}`)
        : chalk.yellow(`  ${countdownHours} hour${countdownHours === 1 ? '' : 's'}`);

    if (!compact) {
      console.log(`  Starts in: ${countdownStr}`);
      console.log();
      for (const s of sessions) {
        const date = new Date(s.date_start);
        const formatted = date.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
        console.log(chalk.dim(`    ${s.session_type.padEnd(16)} ${formatted}`));
      }
    }
  } else if (!compact) {
    console.log(chalk.dim('\n  No upcoming races scheduled.'));
  }

  printTrailingBlank();
}
