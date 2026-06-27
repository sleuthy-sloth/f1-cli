import { api } from '../api/client.js';
import { createDriverTable } from '../utils/formatting.js';
import { printTrailingBlank } from '../utils/display.js';
import { Spinner } from '../utils/spinner.js';
import chalk from 'chalk';
import type { Driver, ChampionshipDriver } from '../api/types.js';

export async function driverCommand(name?: string, jsonMode = false): Promise<void> {
  if (!name) {
    console.error(chalk.red('Please provide a driver name. Usage: f1 driver <name>'));
    process.exit(1);
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  const [meetings, allSessions] = await Spinner.with('Fetching driver data', () =>
    Promise.all([
      api.getMeetings({ year: currentYear }),
      api.getSessions({ year: currentYear }),
    ])
  );

  const raceMeetings = meetings.filter((m) => !m.is_cancelled);

  // Find the latest completed race session to get a driver roster from
  let latestSessionKey: number | 'latest' = 'latest';
  for (let i = raceMeetings.length - 1; i >= 0; i--) {
    const m = raceMeetings[i];
    const sessions = allSessions.filter((s) => s.meeting_key === m.meeting_key);
    const raceSession = sessions.find(
      (s) => s.session_type === 'Race' && new Date(s.date_end) < now
    );
    if (raceSession) {
      latestSessionKey = raceSession.session_key;
      break;
    }
  }

  // Fetch drivers from the latest session and championship standings in parallel
  const [drivers, championshipDrivers] = await Spinner.with('Fetching driver details', () =>
    Promise.all([
      api.getDrivers({
        session_key: typeof latestSessionKey === 'number' ? latestSessionKey : 'latest',
      }),
      api.getChampionshipDrivers({
        session_key: latestSessionKey,
      }),
    ])
  );

  // Case-insensitive partial match on full_name, last_name, broadcast_name, or acronym
  const query = name.toLowerCase();
  const matches = drivers.filter(
    (d: Driver) =>
      d.full_name.toLowerCase().includes(query) ||
      d.last_name.toLowerCase().includes(query) ||
      d.broadcast_name.toLowerCase().includes(query) ||
      d.name_acronym.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    console.error(chalk.red(`No driver found matching "${name}".`));
    process.exit(1);
  }

  // Build a map of championship positions by driver number
  const champMap = new Map<number, ChampionshipDriver>();
  for (const c of championshipDrivers) {
    champMap.set(c.driver_number, c);
  }

  // Deduplicate by driver_number (a driver may appear in multiple sessions)
  const seen = new Set<number>();
  const uniqueMatches = matches.filter((d) => {
    if (seen.has(d.driver_number)) return false;
    seen.add(d.driver_number);
    return true;
  });

  // If multiple unique drivers match, show them as a list
  if (uniqueMatches.length > 1) {
    if (jsonMode) {
      console.log(JSON.stringify({
        query: name,
        matches: uniqueMatches.map((d) => ({
          name: d.full_name,
          number: d.driver_number,
          team: d.team_name,
          acronym: d.name_acronym,
        })),
      }, null, 2));
      return;
    }
    console.log(chalk.cyan(`\n  Multiple drivers matched "${name}":\n`));
    for (const d of uniqueMatches) {
      const champ = champMap.get(d.driver_number);
      const posStr = champ ? chalk.dim(` (P${champ.position_current})`) : '';
      console.log(`    ${chalk.bold(d.full_name)} -- #${d.driver_number} ${d.team_name}${posStr}`);
    }
    console.log(chalk.dim('\n  Refine your search to see full details.\n'));
    return;
  }

  const driver = uniqueMatches[0];
  const champ = champMap.get(driver.driver_number);

  const driverInfo = {
    name: driver.full_name,
    number: driver.driver_number,
    team: driver.team_name,
    teamColor: driver.team_colour,
    countryCode: driver.country_code,
    headshotUrl: driver.headshot_url,
    seasonPoints: champ?.points_current ?? 0,
    championshipPosition: champ?.position_current ?? null,
  };

  if (jsonMode) {
    console.log(JSON.stringify({
      ...driverInfo,
      championshipPosition: driverInfo.championshipPosition,
      acronym: driver.name_acronym,
      firstName: driver.first_name,
      lastName: driver.last_name,
      broadcastName: driver.broadcast_name,
    }, null, 2));
    return;
  }

  console.log(chalk.bold.cyan(`\n  ${driver.full_name}\n`));
  console.log(createDriverTable(driverInfo));
  printTrailingBlank();
}
