import { api } from '../api/client.js';
import { printTrailingBlank } from '../utils/display.js';
import { Spinner } from '../utils/spinner.js';
import chalk from 'chalk';
import { CIRCUITS } from '../data/circuits.js';
import type { Circuit } from '../data/circuits.js';

const F1_RED = '#e10600';

/**
 * Case-insensitive partial match against name, fullName, or gpName.
 */
function findCircuits(query: string): Circuit[] {
  const q = query.toLowerCase();
  return CIRCUITS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.fullName.toLowerCase().includes(q) ||
      c.gpName.toLowerCase().includes(q)
  );
}

/**
 * Build a metadata object for JSON output (no map).
 */
function circuitMetadata(c: Circuit) {
  return {
    name: c.name,
    fullName: c.fullName,
    gpName: c.gpName,
    location: c.location,
    lengthKm: c.lengthKm,
    turns: c.turns,
    direction: c.direction,
    lapRecord: c.lapRecord,
    firstHeld: c.firstHeld,
  };
}

/**
 * DRS zone box-drawing characters -- rendered in cyan.
 */
const DRS_CHARS = new Set('═║╔╗╚╝╠╣╦╩╬');

/**
 * Normal track box-drawing characters -- rendered in white.
 */
const TRACK_CHARS = new Set('─│┌┐└┘├┤┬┴┼╱╲◄►');

/**
 * Render a single map line, applying character-based colors.
 * Multi-character labels are handled first, then individual chars.
 */
function renderMapLine(line: string): string {
  // Multi-character label patterns (applied before single-char processing)
  let result = line
    .replace(/S\/F/g, chalk.hex(F1_RED).bold('S/F'))
    .replace(/\bDRS\b/g, chalk.cyan('DRS'))
    .replace(/\bS([123])\b/g, (_m, n) => chalk.yellow(`S${n}`))
    .replace(/\(PIT\)/g, chalk.blue('(PIT)'))
    .replace(/\[PIT\]/g, chalk.blue('[PIT]'));

  // Single-character color mapping
  result = result
    .split('')
    .map((c) => {
      if (DRS_CHARS.has(c)) return chalk.cyan(c);
      if (TRACK_CHARS.has(c)) return chalk.white(c);
      if (c === '=') return chalk.cyan(c);
      if (c === '+' || c === '-' || c === '|') return chalk.white(c);
      if (c === '/' || c === '\\') return chalk.white(c);
      return c; // spaces, letter labels, numbers pass through
    })
    .join('');

  return result;
}

/**
 * Render the Legend (color key) shown below every track map.
 */
function legend(): string {
  const hr = chalk.dim('─'.repeat(40));
  const key: string[] = [
    '',
    `${hr}`,
    `  ${chalk.white('──')} Normal track     ${chalk.cyan('══')} DRS zone`,
    `  ${chalk.hex(F1_RED).bold('S/F')} Start/finish    ${chalk.yellow('S1')} ${chalk.yellow('S2')} ${chalk.yellow('S3')} Sector markers`,
    `${hr}`,
  ];
  return key.join('\n');
}

/**
 * Render the full track map for a circuit.
 */
function renderMap(circuit: Circuit): string {
  const mapLines = circuit.map
    .map((line) => `  ${renderMapLine(line)}`)
    .join('\n');

  return mapLines;
}

export async function circuitCommand(name?: string, jsonMode = false): Promise<void> {
  // No name given -- fetch the calendar and show all circuits
  if (!name) {
    const now = new Date();
    const currentYear = now.getFullYear();

    const meetings = await Spinner.with('Fetching calendar', () =>
      api.getMeetings({ year: currentYear })
    );

    const activeMeetings = meetings
      .filter((m) => !m.is_cancelled)
      .sort(
        (a, b) =>
          new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      );

    // Build a list from the API circuit_short_names cross-referenced with our data
    const seen = new Set<string>();
    const list: Array<{ circuit: Circuit; round: number }> = [];
    for (let i = 0; i < activeMeetings.length; i++) {
      const m = activeMeetings[i];
      const c = CIRCUITS.find((c) => c.name === m.circuit_short_name);
      if (c && !seen.has(c.name)) {
        seen.add(c.name);
        list.push({ circuit: c, round: i + 1 });
      }
    }

    // Also include any circuits from our data that the API didn't return
    for (const c of CIRCUITS) {
      if (!seen.has(c.name)) {
        seen.add(c.name);
        list.push({ circuit: c, round: list.length + 1 });
      }
    }

    if (jsonMode) {
      console.log(
        JSON.stringify(
          {
            year: currentYear,
            circuits: list.map((item) => ({
              round: item.round,
              ...circuitMetadata(item.circuit),
            })),
          },
          null,
          2
        )
      );
      return;
    }

    console.log(chalk.bold.cyan(`\n  2026 Formula 1 Circuits\n`));
    for (const item of list) {
      const c = item.circuit;
      const round = chalk.dim(`${String(item.round).padStart(2)}. `);
      const gp = chalk.white(c.gpName);
      const loc = chalk.dim(` -- ${c.location}`);
      console.log(`  ${round}${gp}${loc}`);
    }
    console.log(
      chalk.dim(
        `\n  Specify a circuit name to see its track map.\n  Example: f1 circuit monza\n`
      )
    );
    return;
  }

  // Find matching circuits
  const matches = findCircuits(name);

  if (matches.length === 0) {
    if (jsonMode) {
      console.log(JSON.stringify({ query: name, matches: [] }, null, 2));
      return;
    }
    console.error(chalk.red(`No circuit found matching "${name}".`));
    console.log(chalk.dim('\n  Available circuits:'));
    for (const c of CIRCUITS) {
      console.log(
        `    ${chalk.cyan(c.name.padEnd(20))} ${chalk.dim(c.gpName)}`
      );
    }
    console.log();
    process.exit(1);
  }

  if (matches.length > 1) {
    if (jsonMode) {
      console.log(
        JSON.stringify(
          {
            query: name,
            matches: matches.map((c) => circuitMetadata(c)),
          },
          null,
          2
        )
      );
      return;
    }
    console.log(chalk.cyan(`\n  Multiple circuits matched "${name}":\n`));
    for (const c of matches) {
      console.log(
        `    ${chalk.bold(c.name)} -- ${c.gpName} ${chalk.dim(
          `(${c.location})`
        )}`
      );
    }
    console.log(chalk.dim('\n  Refine your search to see the track map.\n'));
    return;
  }

  // Exactly one match -- show details and map
  const circuit = matches[0];

  if (jsonMode) {
    console.log(JSON.stringify(circuitMetadata(circuit), null, 2));
    return;
  }

  // Print the circuit details
  console.log();
  console.log(chalk.bold.cyan(`  ${circuit.fullName}`));
  console.log(
    chalk.white(`  ${circuit.gpName}`) +
      chalk.dim(` -- ${circuit.location}\n`)
  );

  const labelWidth = 12;
  const pad = (s: string) => s.padEnd(labelWidth);

  console.log(`  ${chalk.dim(pad('Length:'))}  ${circuit.lengthKm} km`);
  console.log(`  ${chalk.dim(pad('Turns:'))}  ${circuit.turns}`);
  console.log(`  ${chalk.dim(pad('Direction:'))}  ${circuit.direction}`);
  console.log(`  ${chalk.dim(pad('First GP:'))}  ${circuit.firstHeld}`);
  console.log(`  ${chalk.dim(pad('Lap Record:'))}  ${circuit.lapRecord}`);
  console.log();

  // Print the ASCII track map
  console.log(renderMap(circuit));
  console.log(legend());
  printTrailingBlank();
}
