import { api } from '../api/client.js';
import {
  createResultsTable,
  createPodiumGraphic,
  formatDuration,
  formatGap,
} from '../utils/formatting.js';
import { printTrailingBlank } from '../utils/display.js';
import { Spinner } from '../utils/spinner.js';
import chalk from 'chalk';

export async function resultsCommand(
  year?: number,
  round?: number,
  jsonMode = false
): Promise<void> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();

  const [meetings, allSessions] = await Spinner.with('Fetching race data', () =>
    Promise.all([
      api.getMeetings({ year: targetYear }),
      api.getSessions({ year: targetYear }),
    ])
  );

  const raceMeetings = meetings.filter((m) => !m.is_cancelled);

  let targetMeeting;
  if (round !== undefined) {
    targetMeeting = raceMeetings[round - 1];
    if (!targetMeeting) {
      console.error(chalk.red(`Round ${round} not found for the ${targetYear} season.`));
      process.exit(1);
    }
  } else {
    // Find the most recent completed race -- filter sessions client-side
    // (single API call for the year, no N+1 per-meeting fetches)
    for (let i = raceMeetings.length - 1; i >= 0; i--) {
      const m = raceMeetings[i];
      const sessions = allSessions.filter((s) => s.meeting_key === m.meeting_key);
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

  // Filter sessions for the target meeting (already fetched)
  const sessions = allSessions.filter((s) => s.meeting_key === targetMeeting.meeting_key);
  const raceSession = sessions.find((s) => s.session_type === 'Race');

  if (!raceSession) {
    console.error(chalk.red(`No race session found for ${targetMeeting.meeting_name}.`));
    process.exit(1);
  }

  // Get results and drivers
  const [results, drivers] = await Spinner.with('Fetching results', () =>
    Promise.all([
      api.getSessionResults({ session_key: raceSession.session_key }),
      api.getDrivers({ session_key: raceSession.session_key }),
    ])
  );

  // Sort by position
  results.sort((a, b) => a.position - b.position);

  // Create driver lookups
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  const tableResults = results.map((r) => {
    const driver = driverMap.get(r.driver_number);
    const teamName = driver?.team_name ?? 'Unknown';
    const teamColor = driver?.team_colour;
    const countryCode = driver?.country_code ?? undefined;
    const numericGap = typeof r.gap_to_leader === 'number' ? r.gap_to_leader : undefined;

    return {
      position: r.position,
      driver: driver ? driver.last_name.toUpperCase() : `Driver #${r.driver_number}`,
      team: teamName,
      laps: r.number_of_laps,
      time: formatDuration(r.duration),
      gap: formatGap(r.gap_to_leader),
      points: r.points,
      dnf: r.dnf,
      teamColor,
      countryCode,
      gapValue: numericGap,
    };
  });

  if (jsonMode) {
    console.log(JSON.stringify({
      meeting: targetMeeting.meeting_official_name,
      year: targetYear,
      session_key: raceSession.session_key,
      results: tableResults,
    }, null, 2));
    return;
  }

  console.log(chalk.bold.cyan(`\n  ${targetMeeting.meeting_official_name}\n`));

  // Podium graphic for top 3
  if (tableResults.length >= 3) {
    const podium = tableResults.slice(0, 3).map((r) => ({
      position: r.position,
      driver: r.driver,
      teamColor: r.teamColor,
    }));
    const graphic = createPodiumGraphic(podium);
    if (graphic) console.log(graphic);
  }

  console.log(createResultsTable(tableResults));
  printTrailingBlank();
}
