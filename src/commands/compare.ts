import { api } from '../api/client.js';
import { printTrailingBlank } from '../utils/display.js';
import { Spinner } from '../utils/spinner.js';
import chalk from 'chalk';
import type { Driver, ChampionshipDriver } from '../api/types.js';

/**
 * Find a driver by partial name match against the roster.
 */
function findDriver(query: string, drivers: Driver[]): Driver | undefined {
  const q = query.toLowerCase();
  return (
    drivers.find((d) => d.full_name?.toLowerCase().includes(q)) ||
    drivers.find((d) => d.last_name?.toLowerCase().includes(q)) ||
    drivers.find((d) => d.broadcast_name?.toLowerCase().includes(q)) ||
    drivers.find((d) => d.name_acronym?.toLowerCase() === q)
  );
}

/**
 * Find the latest completed race session key for a given year.
 */
async function findLatestSessionKey(year: number): Promise<number | 'latest'> {
  const now = new Date();
  const meetings = await api.getMeetings({ year });
  const activeMeetings = meetings.filter((m) => !m.is_cancelled);
  const allSessions = await api.getSessions({ year });

  for (let i = activeMeetings.length - 1; i >= 0; i--) {
    const m = activeMeetings[i];
    const sessions = allSessions.filter((s) => s.meeting_key === m.meeting_key);
    const raceSession = sessions.find(
      (s) => s.session_type === 'Race' && new Date(s.date_end) < now
    );
    if (raceSession) {
      return raceSession.session_key;
    }
  }
  return 'latest';
}

export async function compareCommand(
  driver1Name: string,
  driver2Name: string,
  year?: number,
  jsonMode = false,
  compact = false
): Promise<void> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();

  // Find the latest session to get a driver roster
  const latestSessionKey = await Spinner.with('Finding latest race', () =>
    findLatestSessionKey(targetYear)
  );

  // Fetch drivers and championship standings in parallel
  const [drivers, championshipDrivers] = await Spinner.with('Fetching championship data', () =>
    Promise.all([
      api.getDrivers({
        session_key: typeof latestSessionKey === 'number' ? latestSessionKey : 'latest',
      }),
      api.getChampionshipDrivers({
        session_key: latestSessionKey,
      }),
    ])
  );

  const driverA = findDriver(driver1Name, drivers);
  if (!driverA) {
    if (jsonMode) {
      console.log(JSON.stringify({ error: `No driver found matching "${driver1Name}"` }, null, 2));
    } else {
      console.error(chalk.red(`\n  No driver found matching "${driver1Name}".`));
      console.error(chalk.dim('  Try a last name (e.g. "verstappen") or acronym (e.g. "VER").'));
    }
    process.exit(1);
  }

  const driverB = findDriver(driver2Name, drivers);
  if (!driverB) {
    if (jsonMode) {
      console.log(JSON.stringify({ error: `No driver found matching "${driver2Name}"` }, null, 2));
    } else {
      console.error(chalk.red(`\n  No driver found matching "${driver2Name}".`));
      console.error(chalk.dim('  Try a last name (e.g. "verstappen") or acronym (e.g. "VER").'));
    }
    process.exit(1);
  }

  // Build championship lookup
  const champMap = new Map<number, ChampionshipDriver>();
  for (const c of championshipDrivers) {
    champMap.set(c.driver_number, c);
  }

  const champA = champMap.get(driverA.driver_number);
  const champB = champMap.get(driverB.driver_number);

  if (jsonMode) {
    console.log(JSON.stringify({
      year: targetYear,
      driverA: {
        name: driverA.full_name,
        team: driverA.team_name,
        number: driverA.driver_number,
        points: champA?.points_current ?? 0,
        position: champA?.position_current ?? null,
      },
      driverB: {
        name: driverB.full_name,
        team: driverB.team_name,
        number: driverB.driver_number,
        points: champB?.points_current ?? 0,
        position: champB?.position_current ?? null,
      },
      pointsDifference: (champA?.points_current ?? 0) - (champB?.points_current ?? 0),
      positionDifference: (champA?.position_current ?? 99) - (champB?.position_current ?? 99),
    }, null, 2));
    return;
  }

  const pA = champA?.position_current ?? 0;
  const pB = champB?.position_current ?? 0;
  const ptsA = champA?.points_current ?? 0;
  const ptsB = champB?.points_current ?? 0;

  if (compact) {
    const pA = champA?.position_current ?? 0;
    const pB = champB?.position_current ?? 0;
    const ptsA = champA?.points_current ?? 0;
    const ptsB = champB?.points_current ?? 0;
    console.log(`  ${driverA.last_name.toUpperCase()} vs ${driverB.last_name.toUpperCase()}`);
    console.log(`  ${'Team'.padEnd(14)}${driverA.team_name.padEnd(20)}${driverB.team_name}`);
    console.log(`  ${'Points'.padEnd(14)}${String(ptsA).padEnd(20)}${String(ptsB)}`);
    if (champA && champB) {
      const posA = pA > 0 ? `P${pA}` : '-';
      const posB = pB > 0 ? `P${pB}` : '-';
      console.log(`  ${'Pos'.padEnd(14)}${posA.padEnd(20)}${posB}`);
    }
    printTrailingBlank();
    return;
  }

  console.log(chalk.bold.cyan(`\n  ${driverA.last_name.toUpperCase()} vs ${driverB.last_name.toUpperCase()}\n`));

  // Comparison table
  const labelWidth = 12;
  const colWidth = 16;
  const label = (s: string) => chalk.dim(s.padEnd(labelWidth));
  const dA = (s: string) => chalk.bold(s.padEnd(colWidth));
  const dB = (s: string) => chalk.bold(s.padEnd(colWidth));

  console.log(`  ${label('')}        ${dA(driverA.last_name.toUpperCase())} ${dB(driverB.last_name.toUpperCase())}`);
  console.log(`  ${label('Team')}     ${dA(driverA.team_name)} ${dB(driverB.team_name)}`);
  console.log(`  ${label('Number')}   ${dA('#' + driverA.driver_number)} ${dB('#' + driverB.driver_number)}`);

  if (champA && champB) {
    const posA = pA > 0 ? `P${pA}` : '-';
    const posB = pB > 0 ? `P${pB}` : '-';
    console.log(`  ${label('Pos')}      ${dA(posA)} ${dB(posB)}`);
    console.log(`  ${label('Points')}   ${dA(chalk.yellow(String(ptsA)))} ${dB(chalk.yellow(String(ptsB)))}`);

    const posChangeA = champA.position_current - champA.position_start;
    const posChangeB = champB.position_current - champB.position_start;
    const arrowA = posChangeA === 0 ? '--' : posChangeA > 0 ? chalk.red(`↓${posChangeA}`) : chalk.green(`↑${Math.abs(posChangeA)}`);
    const arrowB = posChangeB === 0 ? '--' : posChangeB > 0 ? chalk.red(`↓${posChangeB}`) : chalk.green(`↑${Math.abs(posChangeB)}`);
    console.log(`  ${label('Chg')}      ${dA(arrowA)} ${dB(arrowB)}`);
  }

  console.log();

  if (champA && champB) {
    if (ptsA > ptsB) {
      console.log(`  ${chalk.green(driverA.last_name.toUpperCase())} leads by ${ptsA - ptsB} points`);
    } else if (ptsB > ptsA) {
      console.log(`  ${chalk.green(driverB.last_name.toUpperCase())} leads by ${ptsB - ptsA} points`);
    } else {
      console.log(`  ${chalk.dim('Level on points')}`);
    }
  }

  printTrailingBlank();
}
