/**
 * Lightweight natural language understanding for the f1-cli REPL.
 *
 * This module parses free-form user input (e.g. "what is piastri's gap to
 * hamilton") and translates it into a command + arguments that the existing
 * REPL can execute. It uses regex pattern matching -- no AI, no network, no
 * local index. When input does not match any known pattern, return null so
 * the REPL can fall through to its existing driver-name search.
 */

import { api } from './api/client.js';
import { Spinner } from './utils/spinner.js';
import chalk from 'chalk';
import type { Driver } from './api/types.js';

// -- Types --

export interface NluResult {
  /** The REPL command to run (e.g. "standings", "last", "today") */
  command: string;
  /** Arguments to pass to that command */
  args: string[];
  /** If true, the NLU handler already produced full output and the REPL should
   *  not invoke the normal command runner. */
  handled: boolean;
}

// -- Helpers --

/**
 * Find a driver from a roster using the same fuzzy matching as driverCommand:
 * partial match on full_name, last_name, broadcast_name, or acronym.
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
 * Extract a driver name from text that appears before a given keyword.
 * Looks for patterns like "<name> <keyword>" where keyword helps bound the
 * name (e.g. "piastri's gap", "verstappen has", "leclerc is").
 */
function extractDriverName(text: string): string | null {
  // Strip common possessive / auxiliary endings so we isolate the name
  const cleaned = text
    .replace(/'s/g, '')
    .replace(/\b(has|have|is|are|did|do|does|was|were|will|can)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove trailing question words, filler, and prepositions
  const name = cleaned
    .replace(/\b(how|what|when|where|who|why|which|many|much|points|gap|position|standing|rank|championship|season|current|now|today|race|won|win|result|last|next|upcoming|to|from|in|the|a|an)\b/gi, ' ')
    .replace(/\?/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return name.length > 0 ? name : null;
}

/**
 * Extract two driver names from a comparison query like "piastri vs hamilton"
 * or "gap between piastri and hamilton".
 */
function extractTwoDrivers(text: string): [string, string] | null {
  // Normalize possessives and contractions so names aren't split
  let normalized = text.replace(/'s/g, '').replace(/'/g, '');
  // Strip leading question words/filler that would otherwise be captured as d1
  normalized = normalized.replace(/^(?:what(?:'s| is| are)?|how|who|when|where|why|which|is|are|do|does|did|can|could|would|should|will)\s+/i, '');
  // Patterns: "X vs Y", "X versus Y", "X and Y", "X compared to Y",
  //           "gap between X and Y", "X gap to Y", "X to Y"
  const vsPattern = /(\w[\w]*)\s+(?:vs|versus|v\.?)\s+(\w[\w]*)/i;
  const andPattern = /(\w[\w]*)\s+and\s+(\w[\w]*)/i;
  const betweenPattern = /between\s+(\w[\w]*)\s+and\s+(\w[\w]*)/i;
  const toPattern = /(\w[\w]*)\s+(?:gap\s+)?to\s+(\w[\w]*)/i;

  // Try most specific first
  let match = betweenPattern.exec(normalized) || vsPattern.exec(normalized);
  if (!match) {
    // For "X to Y", only match if the text contains "gap" or "behind" or "ahead"
    // to avoid false positives
    if (/\b(gap|behind|ahead|difference)\b/i.test(normalized)) {
      match = toPattern.exec(normalized) || andPattern.exec(normalized);
    } else {
      match = andPattern.exec(normalized);
    }
  }
  if (match) {
    const d1 = match[1].trim();
    const d2 = match[2]
      .replace(/\b(how|what|many|much|is|are|in|the|championship|standing|position)\b/gi, '')
      .trim();
    if (d1 && d2) return [d1, d2];
  }
  return null;
}

// -- Intent handlers --

async function handleDriverPoints(
  text: string,
  jsonMode: boolean
): Promise<NluResult | null> {
  // Match: "how many points does X have", "what are X's points", "X points this season"
  if (
    !/(?:how many|what(?:'s| is| are)?)\s+points/i.test(text) &&
    !/points\s+(?:does|do|has|have|this season|so far)/i.test(text) &&
    !/(?:'s| has| have)\s+\d*\s*points/i.test(text)
  ) {
    return null;
  }

  const namePart = extractDriverName(text);
  if (!namePart) return null;

  const [drivers, championshipDrivers] = await Spinner.with('Fetching data', () =>
    Promise.all([
      api.getDrivers({ }),
      api.getChampionshipDrivers({ }),
    ])
  );

  const driver = findDriver(namePart, drivers);
  if (!driver) {
    if (jsonMode) {
      console.log(JSON.stringify({ error: `No driver found matching "${namePart}"` }, null, 2));
    } else {
      console.log(chalk.red(`\n  No driver found matching "${namePart}".`));
      console.log(chalk.dim('  Try a last name (e.g. "verstappen") or acronym (e.g. "VER").\n'));
    }
    return { command: '', args: [], handled: true };
  }

  const champ = championshipDrivers.find((c) => c.driver_number === driver.driver_number);

  if (jsonMode) {
    console.log(JSON.stringify({
      driver: driver.full_name,
      team: driver.team_name,
      number: driver.driver_number,
      seasonPoints: champ?.points_current ?? 0,
      championshipPosition: champ?.position_current ?? null,
    }, null, 2));
  } else {
    console.log(chalk.bold.cyan(`\n  ${driver.full_name} -- ${driver.team_name}\n`));
    if (champ) {
      console.log(`  ${chalk.dim('Season Points:')} ${chalk.yellow(String(champ.points_current))}`);
      console.log(`  ${chalk.dim('Championship:')}  P${champ.position_current}`);
      const posChange = champ.position_current - champ.position_start;
      if (posChange !== 0) {
        const arrow = posChange > 0 ? chalk.red(`↓${posChange}`) : chalk.green(`↑${Math.abs(posChange)}`);
        console.log(`  ${chalk.dim('Position change:')} ${arrow}`);
      }
    } else {
      console.log(chalk.dim('  No championship data available.\n'));
    }
    console.log();
  }

  return { command: '', args: [], handled: true };
}

async function handleDriverGap(
  text: string,
  jsonMode: boolean
): Promise<NluResult | null> {
  // Match: "what is X's gap to Y", "X gap to Y", "how far is X from Y", "X vs Y gap"
  if (
    !/(?:gap|far|behind|ahead|difference|compare|vs|versus)/i.test(text)
  ) {
    return null;
  }

  // Must mention "gap" or "far" or "behind" or be a comparison
  if (
    !/\b(gap|far|behind|ahead|difference)\b/i.test(text) &&
    !/(?:vs|versus|compare)/i.test(text)
  ) {
    return null;
  }

  const twoDrivers = extractTwoDrivers(text);
  const singleName = twoDrivers ? twoDrivers[0] : extractDriverName(text);

  if (!singleName) return null;

  // Fetch drivers and championship standings
  const [drivers, championshipDrivers] = await Spinner.with('Fetching standings', () =>
    Promise.all([
      api.getDrivers({}),
      api.getChampionshipDrivers({ }),
    ])
  );

  const driverA = findDriver(singleName, drivers);
  if (!driverA) {
    if (jsonMode) {
      console.log(JSON.stringify({ error: `No driver found matching "${singleName}"` }, null, 2));
    } else {
      console.log(chalk.red(`\n  No driver found matching "${singleName}".\n`));
    }
    return { command: '', args: [], handled: true };
  }

  const champA = championshipDrivers.find((c) => c.driver_number === driverA.driver_number);

  // If we have a second driver, show head-to-head comparison
  if (twoDrivers) {
    const driverB = findDriver(twoDrivers[1], drivers);
    if (!driverB) {
      if (jsonMode) {
        console.log(JSON.stringify({ error: `No driver found matching "${twoDrivers[1]}"` }, null, 2));
      } else {
        console.log(chalk.red(`\n  No driver found matching "${twoDrivers[1]}".\n`));
      }
      return { command: '', args: [], handled: true };
    }

    const champB = championshipDrivers.find((c) => c.driver_number === driverB.driver_number);

    if (jsonMode) {
      console.log(JSON.stringify({
        driverA: {
          name: driverA.full_name,
          team: driverA.team_name,
          points: champA?.points_current ?? 0,
          position: champA?.position_current ?? null,
        },
        driverB: {
          name: driverB.full_name,
          team: driverB.team_name,
          points: champB?.points_current ?? 0,
          position: champB?.position_current ?? null,
        },
        pointsDifference: (champA?.points_current ?? 0) - (champB?.points_current ?? 0),
        positionDifference: (champA?.position_current ?? 0) - (champB?.position_current ?? 0),
      }, null, 2));
    } else {
      console.log(chalk.bold.cyan(`\n  Head-to-Head: ${driverA.last_name.toUpperCase()} vs ${driverB.last_name.toUpperCase()}\n`));
      const pA = champA?.position_current ?? 0;
      const pB = champB?.position_current ?? 0;
      const ptsA = champA?.points_current ?? 0;
      const ptsB = champB?.points_current ?? 0;

      console.log(`  ${chalk.dim('Pos')}  ${chalk.bold(driverA.last_name.toUpperCase().padEnd(12))}  ${chalk.bold(driverB.last_name.toUpperCase().padEnd(12))}`);
      console.log(`  ${chalk.dim('P' + String(pA).padStart(2))}   ${chalk.yellow(String(ptsA).padStart(6))} pts    ${chalk.yellow(String(ptsB).padStart(6))} pts`);
      console.log();

      if (pA < pB) {
        console.log(`  ${driverA.last_name.toUpperCase()} is ahead by ${chalk.green(String(ptsA - ptsB))} points`);
      } else if (pB < pA) {
        console.log(`  ${driverB.last_name.toUpperCase()} is ahead by ${chalk.green(String(ptsB - ptsA))} points`);
      } else {
        console.log(`  Level on points`);
      }
      console.log();
    }
    return { command: '', args: [], handled: true };
  }

  // Single driver gap -- show gap to leader in championship
  if (!champA || championshipDrivers.length === 0) {
    if (jsonMode) {
      console.log(JSON.stringify({ error: 'No championship data available' }, null, 2));
    } else {
      console.log(chalk.dim('\n  No championship data available.\n'));
    }
    return { command: '', args: [], handled: true };
  }

  const leader = championshipDrivers.reduce((a, b) =>
    a.position_current < b.position_current ? a : b
  );
  const leaderDriver = drivers.find((d) => d.driver_number === leader.driver_number);
  const pointsDiff = leader.points_current - champA.points_current;
  const posDiff = champA.position_current - leader.position_current;

  if (jsonMode) {
    console.log(JSON.stringify({
      driver: driverA.full_name,
      team: driverA.team_name,
      championshipPosition: champA.position_current,
      seasonPoints: champA.points_current,
      gapToLeader: {
        leader: leaderDriver?.full_name ?? 'Unknown',
        leaderPoints: leader.points_current,
        pointsBehind: pointsDiff,
        positionsBehind: posDiff,
      },
    }, null, 2));
  } else {
    console.log(chalk.bold.cyan(`\n  ${driverA.full_name} -- Championship Gap\n`));
    console.log(`  ${chalk.dim('Position:')} P${champA.position_current}  (${posDiff === 0 ? 'LEADER' : `${posDiff} place${posDiff > 1 ? 's' : ''} behind`})`);
    console.log(`  ${chalk.dim('Points:')}   ${chalk.yellow(String(champA.points_current))} pts`);
    console.log(`  ${chalk.dim('Leader:')}   ${chalk.yellow(String(leader.points_current))} pts (${leaderDriver?.full_name ?? 'Unknown'})`);
    console.log(`  ${chalk.dim('Gap:')}     ${chalk.red(`-${pointsDiff} pts`)}`);
    console.log();
  }

  return { command: '', args: [], handled: true };
}

async function handleLastRace(text: string, _jsonMode: boolean): Promise<NluResult | null> {
  // Match: "who won the last race", "last race winner", "who won", "last race results"
  if (
    !/(?:who won|last race|latest race|previous race|race result)/i.test(text)
  ) {
    return null;
  }

  // Must be asking about who won or what happened, not "next race"
  if (/\b(next|upcoming|when is)\b/i.test(text)) return null;

  // Delegate to the existing last command
  return { command: 'last', args: [], handled: false };
}

async function handleNextRace(text: string, _jsonMode: boolean): Promise<NluResult | null> {
  // Match: "when is the next race", "next race", "upcoming race", "what's happening this weekend"
  if (
    !/(?:next race|upcoming race|this weekend|next grand prix|when.*race|f1 today|happening|weekend schedule|race weekend|what.*wknd)/i.test(text)
  ) {
    return null;
  }

  return { command: 'today', args: [], handled: false };
}

async function handleWeekendSchedule(text: string, _jsonMode: boolean): Promise<NluResult | null> {
  // Match: "show me the weekend", "weekend breakdown", "weekend timeline", "race weekend schedule"
  if (
    !/(?:weekend|wknd|timeline|breakdown|schedule.*race|race.*schedule|session.*time|when.*session)/i.test(text)
  ) {
    return null;
  }

  // If asking about sessions or weekend specifically, use weekend command
  if (/\b(this weekend|next.*weekend|weekend.*schedule|session.*time|when.*session|wknd)\b/i.test(text)) {
    return { command: 'weekend', args: [], handled: false };
  }

  return null;
}

async function handleStandingsQuery(text: string, _jsonMode: boolean): Promise<NluResult | null> {
  // Match: "who is leading the championship", "championship standings", "who is P1"
  if (
    !/(?:who is leading|championship leader|standings|who is P1|leader of the championship|constructor standings|team standings)/i.test(text)
  ) {
    return null;
  }

  return { command: 'standings', args: [], handled: false };
}

async function handleDriverComparison(
  text: string,
  jsonMode: boolean
): Promise<NluResult | null> {
  // Match: "is X faster than Y", "X or Y", "who is better X or Y", "compare X and Y"
  if (
    !/(?:faster|better|compare|vs|versus|or)\b/i.test(text)
  ) {
    return null;
  }

  const twoDrivers = extractTwoDrivers(text);
  if (!twoDrivers) return null;

  const [drivers, championshipDrivers] = await Spinner.with('Fetching data', () =>
    Promise.all([
      api.getDrivers({}),
      api.getChampionshipDrivers({ }),
    ])
  );

  const driverA = findDriver(twoDrivers[0], drivers);
  const driverB = findDriver(twoDrivers[1], drivers);

  if (!driverA || !driverB) {
    const missing = !driverA ? twoDrivers[0] : twoDrivers[1];
    if (jsonMode) {
      console.log(JSON.stringify({ error: `No driver found matching "${missing}"` }, null, 2));
    } else {
      console.log(chalk.red(`\n  No driver found matching "${missing}".\n`));
    }
    return { command: '', args: [], handled: true };
  }

  const champA = championshipDrivers.find((c) => c.driver_number === driverA.driver_number);
  const champB = championshipDrivers.find((c) => c.driver_number === driverB.driver_number);

  if (jsonMode) {
    console.log(JSON.stringify({
      driverA: {
        name: driverA.full_name,
        team: driverA.team_name,
        points: champA?.points_current ?? 0,
        position: champA?.position_current ?? null,
      },
      driverB: {
        name: driverB.full_name,
        team: driverB.team_name,
        points: champB?.points_current ?? 0,
        position: champB?.position_current ?? null,
      },
    }, null, 2));
  } else {
    console.log(chalk.bold.cyan(`\n  ${driverA.last_name.toUpperCase()} vs ${driverB.last_name.toUpperCase()}\n`));
    const pA = champA?.position_current ?? 0;
    const pB = champB?.position_current ?? 0;
    const ptsA = champA?.points_current ?? 0;
    const ptsB = champB?.points_current ?? 0;

    console.log(`  ${''.padEnd(16)} ${chalk.bold(driverA.last_name.toUpperCase().padEnd(14))} ${chalk.bold(driverB.last_name.toUpperCase().padEnd(14))}`);
    console.log(`  ${chalk.dim('Pos'.padEnd(16))} P${String(pA).padEnd(13)} P${pB}`);
    console.log(`  ${chalk.dim('Points'.padEnd(16))} ${chalk.yellow(String(ptsA).padEnd(14))} ${chalk.yellow(String(ptsB))}`);
    console.log();

    if (pA < pB) {
      console.log(`  ${chalk.green(driverA.last_name.toUpperCase())} leads by ${ptsA - ptsB} points`);
    } else if (pB < pA) {
      console.log(`  ${chalk.green(driverB.last_name.toUpperCase())} leads by ${ptsB - ptsA} points`);
    } else {
      console.log(`  ${chalk.dim('Level on points')}`);
    }
    console.log();
  }

  return { command: '', args: [], handled: true };
}

// -- Main parser --

/**
 * Parse user input from the REPL. Returns an NluResult describing how to
 * handle the query, or null if the input does not match any known pattern
 * (in which case the REPL falls through to its existing driver-name search).
 */
export async function parseNaturalLanguage(
  text: string,
  jsonMode = false
): Promise<NluResult | null> {
  const lower = text.toLowerCase().trim();

  // Quick reject: very short input or single-word driver name (let the REPL handle it)
  if (lower.length < 3) return null;

  // Try each intent handler in order of specificity (most specific first)

  // 1. Driver comparison (two names)
  if (extractTwoDrivers(text)) {
    const result = await handleDriverComparison(text, jsonMode);
    if (result) return result;
    // Fall through to gap handler if comparison didn't match
  }

  // 2. Driver gap to another driver or leader
  if (await handleDriverGap(text, jsonMode)) {
    return handleDriverGap(text, jsonMode);
  }

  // 3. Driver points query
  if (await handleDriverPoints(text, jsonMode)) {
    return handleDriverPoints(text, jsonMode);
  }

  // 4. Last race / who won
  if (await handleLastRace(text, jsonMode)) {
    return handleLastRace(text, jsonMode);
  }

  // 5. Next race / upcoming
  if (await handleNextRace(text, jsonMode)) {
    return handleNextRace(text, jsonMode);
  }

  // 6. Weekend schedule / timeline
  if (await handleWeekendSchedule(text, jsonMode)) {
    return handleWeekendSchedule(text, jsonMode);
  }

  // 7. Championship standings / leader
  if (await handleStandingsQuery(text, jsonMode)) {
    return handleStandingsQuery(text, jsonMode);
  }

  // No match -- let the REPL fall through to driver-name search
  return null;
}
