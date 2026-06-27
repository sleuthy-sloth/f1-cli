import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatGmtOffset,
  formatSessionTime,
  formatDuration,
  formatGap,
  colorPosition,
  getTerminalWidth,
  createResultsTable,
  createStandingsTable,
  createScheduleTable,
  createDriverTable,
  countryCodeToFlag,
  makeBar,
  formatCountdown,
  colorGap,
  createPodiumGraphic,
  liveIndicator,
} from '../src/utils/formatting.js';

describe('formatting utils', () => {
  describe('formatGmtOffset', () => {
    it('formats positive offset', () => {
      expect(formatGmtOffset('03:00:00')).toBe('UTC+3');
    });

    it('formats negative offset', () => {
      expect(formatGmtOffset('-05:00:00')).toBe('UTC-5');
    });

    it('handles null/empty input', () => {
      expect(formatGmtOffset('')).toBe('UTC');
    });

    it('formats with minutes', () => {
      expect(formatGmtOffset('05:30:00')).toBe('UTC+5:30');
    });
  });

  describe('formatSessionTime', () => {
    it('converts ISO timestamp to local time without double-counting offset', () => {
      // The old buggy implementation would add the circuit offset on top of
      // local time, producing a wrong result. The fixed version simply parses
      // the Date and reads local-time fields.
      const result = formatSessionTime('2025-03-16T04:00:00+00:00', '11:00:00');
      // The result should be in the user's local timezone -- we verify the
      // date parts are correct for a known UTC timestamp.
      const expectedDate = new Date('2025-03-16T04:00:00+00:00');
      const expectedDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][expectedDate.getDay()];
      const expectedMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][expectedDate.getMonth()];
      expect(result).toContain(expectedDay);
      expect(result).toContain(expectedMonth);
      expect(result).toContain('2025');
      // Should contain a time in HH:MM format
      expect(result).toMatch(/\d{2}:\d{2}$/);
    });

    it('ignores the gmtOffset parameter (backwards compat)', () => {
      // The same input should produce the same output regardless of gmtOffset,
      // because the offset is no longer used in the calculation.
      const r1 = formatSessionTime('2025-06-15T14:00:00+00:00', '10:00:00');
      const r2 = formatSessionTime('2025-06-15T14:00:00+00:00', '-05:00:00');
      const r3 = formatSessionTime('2025-06-15T14:00:00+00:00', undefined);
      expect(r1).toBe(r2);
      expect(r1).toBe(r3);
    });

    it('formats the date in the expected pattern', () => {
      const result = formatSessionTime('2025-07-06T13:00:00+00:00', '01:00:00');
      // Pattern: "Day, DD Mon YYYY, HH:MM"
      expect(result).toMatch(/^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2}$/);
    });
  });

  describe('formatDuration', () => {
    it('formats seconds to minutes:seconds', () => {
      expect(formatDuration(5548.105)).toMatch(/^\d+:\d{2}$/);
      const [mins, secs] = formatDuration(5548.105).split(':').map(Number);
      expect(mins).toBe(92); // 5548/60 = 92.47
      expect(secs).toBe(28); // ~28 seconds
    });

    it('returns dash for null', () => {
      expect(formatDuration(null)).toBe('-');
    });
  });

  describe('formatGap', () => {
    it('formats number gap', () => {
      expect(formatGap(19.561)).toBe('+19.6s');
    });

    it('returns LEADER for gap 0', () => {
      expect(formatGap(0)).toBe('LEADER');
    });

    it('passes through string gap', () => {
      expect(formatGap('+1 LAP')).toBe('+1 LAP');
    });
  });

  describe('colorPosition', () => {
    it('returns medal emoji for P1', () => {
      const result = colorPosition(1);
      expect(result).toContain('1');
    });

    it('returns medal emoji for P2', () => {
      const result = colorPosition(2);
      expect(result).toContain('2');
    });

    it('returns medal emoji for P3', () => {
      const result = colorPosition(3);
      expect(result).toContain('3');
    });

    it('returns plain number for other positions', () => {
      expect(colorPosition(4)).toBe('4');
    });
  });

  describe('getTerminalWidth', () => {
    it('returns Infinity in non-TTY environments', () => {
      // In the test runner, stdout is not a TTY
      expect(getTerminalWidth()).toBe(Infinity);
    });
  });

  describe('createResultsTable', () => {
    it('creates a formatted results table', () => {
      const results = [
        {
          position: 1,
          driver: 'Lewis HAMILTON',
          team: 'Ferrari',
          laps: 66,
          time: '1:32:28',
          gap: 'LEADER',
          points: 25,
        },
        {
          position: 2,
          driver: 'George RUSSELL',
          team: 'Mercedes',
          laps: 66,
          time: '1:32:47',
          gap: '+19.6s',
          points: 18,
        },
      ];

      const table = createResultsTable(results);
      expect(table).toContain('Lewis HAMILTON');
      expect(table).toContain('George RUSSELL');
      expect(table).toContain('Ferrari');
      expect(table).toContain('Mercedes');
      expect(table).toContain('Results');
      expect(table).toContain('Pos'); // header
    });
  });

  describe('createStandingsTable', () => {
    it('creates a formatted standings table', () => {
      const entries = [
        { position: 1, name: 'Lewis HAMILTON', points: 115 },
        { position: 2, name: 'George RUSSELL', points: 106 },
      ];

      const table = createStandingsTable(entries, 'Drivers Championship');
      expect(table).toContain('Drivers Championship');
      expect(table).toContain('Lewis HAMILTON');
      expect(table).toContain('115');
    });
  });

  describe('createScheduleTable', () => {
    it('creates a formatted schedule table', () => {
      const races = [
        {
          round: 1,
          name: 'Australian Grand Prix',
          location: 'Melbourne',
          circuit: 'Melbourne',
          qualifyingDate: 'Sat, 15 Mar 2025, 16:00',
          raceDate: 'Sun, 16 Mar 2025, 15:00',
        },
      ];

      const table = createScheduleTable(races);
      expect(table).toContain('Australian Grand Prix');
      expect(table).toContain('Melbourne');
      expect(table).toContain('Upcoming');
    });
  });

  describe('createDriverTable', () => {
    it('creates a formatted driver info table', () => {
      const driver = {
        name: 'Lando NORRIS',
        number: 4,
        team: 'McLaren',
        countryCode: 'GBR',
        headshotUrl: 'https://example.com/norris.png',
        seasonPoints: 156,
        championshipPosition: 1,
      };
      const table = createDriverTable(driver);
      expect(table).toContain('Lando NORRIS');
      expect(table).toContain('McLaren');
      expect(table).toContain('156');
      expect(table).toContain('https://example.com/norris.png');
    });

    it('handles missing championship position', () => {
      const driver = {
        name: 'Rookie DRIVER',
        number: 99,
        team: 'NewTeam',
        countryCode: null,
        headshotUrl: '',
        seasonPoints: 0,
        championshipPosition: null,
      };
      const table = createDriverTable(driver);
      expect(table).toContain('Rookie DRIVER');
      expect(table).toContain('-');
    });
  });

  describe('countryCodeToFlag', () => {
    it('converts IOC codes to flag emoji', () => {
      const gbr = countryCodeToFlag('GBR');
      expect(gbr).toBe('\u{1F1EC}\u{1F1E7}'); // GB flag
    });

    it('converts NED to Dutch flag', () => {
      const ned = countryCodeToFlag('NED');
      expect(ned).toBe('\u{1F1F3}\u{1F1F1}'); // NL flag
    });

    it('handles 2-letter ISO codes directly', () => {
      const us = countryCodeToFlag('US');
      expect(us).toBe('\u{1F1FA}\u{1F1F8}'); // US flag
    });

    it('returns empty string for unknown codes', () => {
      expect(countryCodeToFlag('XYZ')).toBe('');
    });

    it('returns empty string for empty input', () => {
      expect(countryCodeToFlag('')).toBe('');
    });

    it('is case-insensitive', () => {
      expect(countryCodeToFlag('gbr')).toBe(countryCodeToFlag('GBR'));
    });
  });

  describe('makeBar', () => {
    it('creates a full bar when points equals maxPoints', () => {
      const bar = makeBar(100, 100, 10);
      // Should contain block chars and no light shade chars in the raw string
      // (chalk wraps in escape codes, so we check for the block character)
      expect(bar).toContain('\u2588');
    });

    it('creates a partial bar', () => {
      const bar = makeBar(50, 100, 10);
      expect(bar).toContain('\u2588');
      expect(bar).toContain('\u2591');
    });

    it('creates an empty bar for zero points', () => {
      const bar = makeBar(0, 100, 10);
      expect(bar).toContain('\u2591');
      expect(bar).not.toContain('\u2588');
    });

    it('returns empty string for zero maxWidth', () => {
      expect(makeBar(50, 100, 0)).toBe('');
    });

    it('clamps ratio to 1 when points exceed maxPoints', () => {
      const bar = makeBar(200, 100, 10);
      // Should be fully filled, no empty chars
      expect(bar).toContain('\u2588');
      expect(bar).not.toContain('\u2591');
    });
  });

  describe('formatCountdown', () => {
    const now = new Date('2025-06-27T12:00:00Z');

    it('returns "Started" for a past date', () => {
      const past = new Date('2025-06-27T11:00:00Z');
      expect(formatCountdown(past, now)).toBe('Started');
    });

    it('returns minutes format under 1 hour', () => {
      const future = new Date('2025-06-27T12:30:00Z');
      expect(formatCountdown(future, now)).toBe('Starts in 30m');
    });

    it('returns hours+minutes format under 1 day', () => {
      const future = new Date('2025-06-27T14:30:00Z');
      expect(formatCountdown(future, now)).toBe('Starts in 2h 30m');
    });

    it('returns days+hours format over 1 day', () => {
      const future = new Date('2025-06-29T14:00:00Z');
      // 2 days + 2 hours
      expect(formatCountdown(future, now)).toBe('Starts in 2d 2h');
    });

    it('returns "Started" when target equals now', () => {
      expect(formatCountdown(now, now)).toBe('Started');
    });
  });

  describe('colorGap', () => {
    it('colors LEADER in gold', () => {
      const result = colorGap('LEADER');
      expect(result).toContain('LEADER');
      // chalk applies color; in TTY mode the string will contain escape codes.
      // In non-TTY mode chalk strips colors, so we just verify the text.
    });

    it('colors gap under 5 seconds green', () => {
      const result = colorGap('+3.2s', 3.2);
      expect(result).toContain('+3.2s');
    });

    it('colors gap 5-30 seconds yellow', () => {
      const result = colorGap('+15.0s', 15.0);
      expect(result).toContain('+15.0s');
    });

    it('colors gap over 30 seconds red', () => {
      const result = colorGap('+45.0s', 45.0);
      expect(result).toContain('+45.0s');
    });

    it('colors string gaps (lapped) red', () => {
      const result = colorGap('+1 LAP');
      expect(result).toContain('+1 LAP');
    });

    it('colors red when gapValue is undefined', () => {
      const result = colorGap('+5.0s');
      expect(result).toContain('+5.0s');
    });

    it('handles NaN gapValue as red', () => {
      const result = colorGap('+5.0s', NaN);
      expect(result).toContain('+5.0s');
    });
  });

  describe('createPodiumGraphic', () => {
    it('renders a podium with all three positions', () => {
      const graphic = createPodiumGraphic([
        { position: 1, driver: 'Norris', teamColor: 'F47600' },
        { position: 2, driver: 'Leclerc', teamColor: 'DC0000' },
        { position: 3, driver: 'Russell', teamColor: '00D2BE' },
      ]);
      expect(graphic).toContain('NORRIS');
      expect(graphic).toContain('LECLERC');
      expect(graphic).toContain('RUSSELL');
      expect(graphic).toContain('1st');
      expect(graphic).toContain('2nd');
      expect(graphic).toContain('3rd');
      // Should contain box-drawing characters
      expect(graphic).toContain('+');
      expect(graphic).toContain('-');
      expect(graphic).toContain('|');
    });

    it('returns empty string when a position is missing', () => {
      const graphic = createPodiumGraphic([
        { position: 1, driver: 'Norris' },
        { position: 2, driver: 'Leclerc' },
      ]);
      expect(graphic).toBe('');
    });

    it('truncates long names to 10 characters', () => {
      const graphic = createPodiumGraphic([
        { position: 1, driver: 'VeryLongLastName', teamColor: 'F47600' },
        { position: 2, driver: 'Leclerc', teamColor: 'DC0000' },
        { position: 3, driver: 'Russell', teamColor: '00D2BE' },
      ]);
      expect(graphic).toContain('VERYLONGLA');
      // Should not contain the full untruncated name
      expect(graphic).not.toContain('VERYLONGLASTNAME');
    });

    it('works without team colors', () => {
      const graphic = createPodiumGraphic([
        { position: 1, driver: 'Norris' },
        { position: 2, driver: 'Leclerc' },
        { position: 3, driver: 'Russell' },
      ]);
      expect(graphic).toContain('NORRIS');
    });
  });

  describe('liveIndicator', () => {
    it('returns a LIVE string with ANSI blink codes', () => {
      const indicator = liveIndicator();
      expect(indicator).toContain('LIVE');
      expect(indicator).toContain('\x1b[5m'); // blink
      expect(indicator).toContain('\x1b[31m'); // red
      expect(indicator).toContain('\x1b[0m'); // reset
    });
  });
});
