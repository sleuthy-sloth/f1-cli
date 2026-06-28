import { api } from '../api/client.js';
import { printTrailingBlank } from '../utils/display.js';
import { Spinner } from '../utils/spinner.js';
import chalk from 'chalk';
import { CIRCUITS } from '../data/circuits.js';
import type { Circuit } from '../data/circuits.js';

const F1_RED = '#e10600';
const TRACK_WHITE = '#e8e8e8';

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
const TRACK_CHARS = new Set('─│┌┐└┘├┤┬┴┼╱╲');

/**
 * Pit lane characters -- rendered in blue.
 */
const PIT_CHARS = new Set('╻╹╽╿┊┆');

/**
 * Elevation characters -- rendered in yellow.
 */
const ELEVATION_CHARS = new Set('↑↓↗↘');

/**
 * Render a single map line, applying character-based colors.
 * Multi-character label patterns are handled first, then individual chars.
 */
function renderMapLine(line: string, isPitLine: boolean = false): string {
  // Multi-character label patterns (applied before single-char processing)
  let result = line
    // Famous corner names / track sections in magenta
    .replace(
      /MAGGOTTS|BECKETTS|CHAPEL|EAU ROUGE|RAIDILLON|PARABOLICA|ASCARI|COPSE|STOWE|CLUB|PISCINE|MIRABEAU|PORTIER|CASINO|TUNNEL|NOUVELLE|TABAC|SWIMMING POOL|RASCASSE|CHICANE|FORO SOL|STADIUM|HUGERHOLTZ|CASTLE|BANKING/gi,
      (m) => chalk.magenta(m)
    )
    // S/F label in bold red
    .replace(/S\/F/g, chalk.hex(F1_RED).bold('S/F'))
    // DRS text label in cyan (standalone word)
    .replace(/\bDRS\b(?![\wΑ-Ωα-ω])/g, chalk.cyan('DRS'))
    // DRS detection marker
    .replace(/DRS DETECT/g, chalk.cyan('DRS DETECT'))
    // Sector markers S1/S2/S3 in yellow
    .replace(/\bS([123])\b/g, (_m, n) => chalk.yellow(`S${n}`))
    // Corner numbers T1-T99 in yellow
    .replace(/\bT(\d{1,2})\b/g, (_m, n) => chalk.yellow(`T${n}`))
    // Corner numbers with letter suffix (T1-T50A)
    .replace(/\bT(\d{1,2}[A-Z])\b/g, (_m, n) => chalk.yellow(`T${n}`))
    // Pit labels in blue
    .replace(/\(PIT\)/g, chalk.blue('(PIT)'))
    .replace(/\[PIT\]/g, chalk.blue('[PIT]'))
    .replace(/PIT IN/g, chalk.blue('PIT IN'))
    .replace(/PIT OUT/g, chalk.blue('PIT OUT'))
    .replace(/PIT/g, chalk.blue('PIT'))
    // Grandstand markers in dim
    .replace(/\(G\)/g, chalk.dim('(G)'));

  // Single-character color mapping
  result = result
    .split('')
    .map((c) => {
      if (DRS_CHARS.has(c)) return chalk.cyan(c);
      if (PIT_CHARS.has(c)) return chalk.blue(c);
      if (ELEVATION_CHARS.has(c)) return chalk.yellow(c);
      // Intensity gradient chars
      if (c === '▓') return chalk.hex(F1_RED)(c);
      if (c === '▒') return chalk.yellow(c);
      if (c === '░') return chalk.green(c);
      // Track chars
      if (isPitLine) {
        if (TRACK_CHARS.has(c)) return chalk.blue(c);
      } else {
        if (TRACK_CHARS.has(c)) return chalk.hex(TRACK_WHITE)(c);
      }
      if (c === '=') return chalk.cyan(c);
      if (c === '+' || c === '-' || c === '|') return chalk.hex(TRACK_WHITE)(c);
      if (c === '/' || c === '\\') return chalk.hex(TRACK_WHITE)(c);
      return c; // spaces, letter labels, numbers pass through
    })
    .join('');

  return result;
}

/**
 * Render the compass indicator showing track direction.
 */
function compass(direction: 'Clockwise' | 'Anti-clockwise'): string {
  const n = chalk.white.bold('N');
  const e = chalk.white.bold('E');
  const s = chalk.white.bold('S');
  const w = chalk.white.bold('W');
  const dirArrow = direction === 'Clockwise' ? '↻' : '↺';
  const dirLabel = direction === 'Clockwise' ? 'CW' : 'ACW';
  return chalk.dim(`[${n}─${e}─${s}─${w}] ${chalk.cyan(dirArrow)}${chalk.dim(dirLabel)}`);
}

/**
 * Render the Legend (color key) shown below every track map.
 */
function legend(): string {
  const hr = chalk.dim('─'.repeat(44));
  const key: string[] = [
    '',
    `${hr}`,
    `  ${chalk.hex(TRACK_WHITE)('──')} Normal track     ${chalk.cyan('══')} DRS zone` +
      `     ${chalk.blue('╻╹')} Pit lane`,
    `  ${chalk.hex(F1_RED).bold('S/F')} Start/finish    ${chalk.yellow('T1')} Corners` +
      `      ${chalk.yellow('↑↓')} Elevation`,
    `  ${chalk.yellow('S1 S2 S3')} Sector marks   ${chalk.magenta('MAGENTA')} Famous sections` +
      `  ${chalk.red('▓')}${chalk.yellow('▒')}${chalk.green('░')} Speed gradient`,
    `${hr}`,
  ];
  return key.join('\n');
}

/**
 * Render the full track map for a circuit, with border and header.
 */
function renderMap(circuit: Circuit): string {
  const mapWidth = Math.max(...circuit.map.map((l) => l.length));
  const border = chalk.dim('═'.repeat(mapWidth + 4));

  // Header line with circuit name and compass
  const compassStr = compass(circuit.direction);
  const headerGap = mapWidth + 2 - compassStr.length - circuit.fullName.length;
  const gap = headerGap > 0 ? ' '.repeat(headerGap) : ' ';
  const header = `  ${chalk.dim('╔')}${border}${chalk.dim('╗')}`;
  const titleLine = `  ${chalk.dim('║')}  ${chalk.bold.cyan(circuit.fullName)}${gap}${compassStr}  ${chalk.dim('║')}`;
  const gpLine = `  ${chalk.dim('║')}  ${chalk.white(circuit.gpName)}${chalk.dim(
    ' -- '
  )}${circuit.location}${' '.repeat(Math.max(0, mapWidth - circuit.gpName.length - circuit.location.length - 5))}  ${chalk.dim('║')}`;
  const divider = `  ${chalk.dim('╠')}${border}${chalk.dim('╣')}`;
  const footer = `  ${chalk.dim('╚')}${border}${chalk.dim('╝')}`;

  // Map lines with side borders
  const mapLines = circuit.map
    .map((line) => {
      const padded = line.padEnd(mapWidth);
      const rendered = renderMapLine(padded);
      return `  ${chalk.dim('║')} ${rendered} ${chalk.dim('║')}`;
    })
    .join('\n');

  // Stats line
  const stats = `  ${chalk.dim('║')}  ${chalk.dim(
    `${circuit.lengthKm} km \u00B7 ${circuit.turns} turns \u00B7 ${circuit.direction} \u00B7 First GP ${circuit.firstHeld}`
  )}${' '.repeat(Math.max(0, mapWidth - 38))}  ${chalk.dim('║')}`;

  return [
    header,
    titleLine,
    gpLine,
    divider,
    mapLines,
    divider,
    stats,
    footer,
  ].join('\n');
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

  // Print the circuit details + track map
  console.log();
  console.log(renderMap(circuit));
  console.log(legend());
  printTrailingBlank();
}
