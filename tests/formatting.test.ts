import { describe, it, expect } from 'vitest';
import {
  formatGmtOffset,
  formatDuration,
  formatGap,
  colorPosition,
  createResultsTable,
  createStandingsTable,
  createScheduleTable,
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
          qualifyingDate: 'Sat, 15 Mar 2025, 16:00 UTC+11',
          raceDate: 'Sun, 16 Mar 2025, 15:00 UTC+11',
        },
      ];

      const table = createScheduleTable(races);
      expect(table).toContain('Australian Grand Prix');
      expect(table).toContain('Melbourne');
      expect(table).toContain('Upcoming');
    });
  });
});
