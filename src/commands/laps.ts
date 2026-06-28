import { api } from '../api/client.js';
import { formatDuration } from '../utils/formatting.js';
import { printTrailingBlank } from '../utils/display.js';
import { Spinner } from '../utils/spinner.js';
import chalk from 'chalk';

/**
 * Find the latest completed race session for a given year.
 */
async function findLatestRaceSession(year: number): Promise<{
  sessionKey: number;
  meetingName: string;
} | null> {
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
      return { sessionKey: raceSession.session_key, meetingName: m.meeting_official_name };
    }
  }
  return null;
}

export async function lapsCommand(
  year?: number,
  driverNumber?: number,
  jsonMode = false,
  compact = false
): Promise<void> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();

  // Find the latest race session
  const race = await Spinner.with('Finding latest race', () => findLatestRaceSession(targetYear));

  if (!race) {
    if (jsonMode) {
      console.log(JSON.stringify({ error: 'No completed race found' }, null, 2));
      return;
    }
    console.error(chalk.red('No completed race found for the specified year.'));
    process.exit(1);
  }

  // Fetch laps and drivers in parallel
  const [laps, drivers] = await Spinner.with('Fetching lap data', () =>
    Promise.all([
      api.getLaps({
        session_key: race.sessionKey,
        driver_number: driverNumber,
      }),
      api.getDrivers({ session_key: race.sessionKey }),
    ])
  );

  if (laps.length === 0) {
    if (jsonMode) {
      console.log(JSON.stringify({ error: 'No lap data available' }, null, 2));
      return;
    }
    console.log(chalk.dim('\n  No lap data available for this session.\n'));
    return;
  }

  // Build driver lookup
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  // Group laps by driver
  const driverLaps = new Map<number, typeof laps>();
  for (const lap of laps) {
    if (!driverLaps.has(lap.driver_number)) {
      driverLaps.set(lap.driver_number, []);
    }
    driverLaps.get(lap.driver_number)!.push(lap);
  }

  // Sort drivers by best lap time
  const driverBestLaps = Array.from(driverLaps.entries())
    .map(([driverNum, driverLapList]) => {
      const validLaps = driverLapList.filter((l) => l.lap_duration && !l.is_pit_out_lap);
      const bestLap = validLaps.reduce<typeof laps[number] | null>((best, l) => {
        if (!best || !best.lap_duration) return l;
        return l.lap_duration < best.lap_duration ? l : best;
      }, null);
      return { driverNum, bestLap, totalLaps: driverLapList.length };
    })
    .filter((d) => d.bestLap !== null)
    .sort((a, b) => (a.bestLap!.lap_duration ?? Infinity) - (b.bestLap!.lap_duration ?? Infinity));

  if (jsonMode) {
    console.log(JSON.stringify({
      meeting: race.meetingName,
      session_key: race.sessionKey,
      drivers: driverBestLaps.map((d) => {
        const driver = driverMap.get(d.driverNum);
        return {
          driver: driver?.full_name ?? `Driver #${d.driverNum}`,
          number: d.driverNum,
          team: driver?.team_name ?? 'Unknown',
          bestLap: formatDuration(d.bestLap!.lap_duration),
          bestLapNumber: d.bestLap!.lap_number,
          totalLaps: d.totalLaps,
        };
      }),
    }, null, 2));
    return;
  }

  // Display
  if (compact) {
    // Compact: plain text list
    driverBestLaps.forEach((d, i) => {
      const driver = driverMap.get(d.driverNum);
      const name = (driver?.last_name ?? `D#${d.driverNum}`).toUpperCase();
      const bestTime = formatDuration(d.bestLap!.lap_duration);
      console.log(`  ${i + 1}. ${name} (${driver?.team_name ?? 'Unknown'}) -- ${bestTime} (lap ${d.bestLap!.lap_number})`);
    });
    printTrailingBlank();
    return;
  }

  console.log(chalk.bold.cyan(`\n  Lap Times -- ${race.meetingName}\n`));

  if (driverNumber) {
    // Show all laps for a specific driver
    const driverLapList = driverLaps.get(driverNumber);
    const driver = driverMap.get(driverNumber);
    if (driverLapList) {
      console.log(`  ${chalk.bold(driver?.full_name ?? `Driver #${driverNumber}`)} (${driver?.team_name ?? 'Unknown'})\n`);
      const validLaps = driverLapList.filter((l) => l.lap_duration && !l.is_pit_out_lap);
      const bestDuration = Math.min(...validLaps.map((l) => l.lap_duration!));

      const displayLaps = validLaps.slice(0, 20); // Show top 20 laps
      for (const lap of displayLaps) {
        const timeStr = formatDuration(lap.lap_duration);
        const isBest = lap.lap_duration === bestDuration;
        const marker = isBest ? chalk.green(' ★') : '';
        const sectors = `S1: ${formatDuration(lap.duration_sector_1)}  S2: ${formatDuration(lap.duration_sector_2)}  S3: ${formatDuration(lap.duration_sector_3)}`;
        console.log(`  ${chalk.dim(`Lap ${String(lap.lap_number).padStart(3)}`)}  ${chalk.yellow(timeStr)}${marker}  ${chalk.dim(sectors)}`);
      }
      if (validLaps.length > 20) {
        console.log(chalk.dim(`\n  ... and ${validLaps.length - 20} more laps`));
      }
    }
  } else {
    // Show best lap for each driver
    console.log(`  ${chalk.dim('Pos')}  ${chalk.dim('Driver'.padEnd(20))}  ${chalk.dim('Team'.padEnd(18))}  ${chalk.dim('Best Lap'.padEnd(12))}  ${chalk.dim('Lap #')}  ${chalk.dim('Total')}`);
    console.log(`  ${chalk.dim('─'.repeat(75))}`);

    driverBestLaps.forEach((d, i) => {
      const driver = driverMap.get(d.driverNum);
      const pos = chalk.cyan(String(i + 1).padStart(3));
      const name = chalk.bold((driver?.last_name ?? `D#${d.driverNum}`).toUpperCase().padEnd(20));
      const team = (driver?.team_name ?? 'Unknown').padEnd(18);
      const bestTime = chalk.yellow(formatDuration(d.bestLap!.lap_duration).padEnd(12));
      const lapNum = String(d.bestLap!.lap_number).padStart(4);
      const total = chalk.dim(String(d.totalLaps));
      console.log(`  ${pos}  ${name}  ${team}  ${bestTime}  ${lapNum}  ${total}`);
    });
  }

  printTrailingBlank();
}
