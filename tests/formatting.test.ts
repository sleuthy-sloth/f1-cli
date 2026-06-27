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
});
