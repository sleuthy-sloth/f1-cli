import { describe, it, expect } from 'vitest';
import { CIRCUITS } from '../src/data/circuits.js';
import type { Circuit } from '../src/data/circuits.js';

const REQUIRED_FIELDS: (keyof Circuit)[] = [
  'name',
  'fullName',
  'gpName',
  'location',
  'lengthKm',
  'turns',
  'lapRecord',
  'firstHeld',
  'direction',
  'map',
  'startLine',
];

const EXPECTED_NAMES = [
  'Melbourne',
  'Shanghai',
  'Suzuka',
  'Baku',
  'Miami',
  'Monte Carlo',
  'Montreal',
  'Catalunya',
  'Madring',
  'Spielberg',
  'Silverstone',
  'Spa-Francorchamps',
  'Hungaroring',
  'Zandvoort',
  'Monza',
  'Singapore',
  'Austin',
  'Mexico City',
  'Interlagos',
  'Las Vegas',
  'Lusail',
  'Yas Marina Circuit',
  'Sakhir',
];

describe('Circuit data integrity', () => {
  it('has exactly 23 circuits', () => {
    expect(CIRCUITS).toHaveLength(23);
  });

  it('contains all expected circuit names', () => {
    const names = CIRCUITS.map((c) => c.name);
    for (const expected of EXPECTED_NAMES) {
      expect(names).toContain(expected);
    }
  });

  it('all circuits have required fields', () => {
    for (const c of CIRCUITS) {
      for (const field of REQUIRED_FIELDS) {
        expect(c).toHaveProperty(field);
        const value = c[field];
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
      }
    }
  });

  it('all maps are non-empty arrays of strings', () => {
    for (const c of CIRCUITS) {
      expect(Array.isArray(c.map)).toBe(true);
      expect(c.map.length).toBeGreaterThanOrEqual(10);
      expect(c.map.length).toBeLessThanOrEqual(18);
      for (const line of c.map) {
        expect(typeof line).toBe('string');
        expect(line.length).toBeGreaterThan(0);
        expect(line.length).toBeLessThanOrEqual(55);
      }
    }
  });

  it('all startLine positions are valid indices within the map', () => {
    for (const c of CIRCUITS) {
      expect(Array.isArray(c.startLine)).toBe(true);
      expect(c.startLine).toHaveLength(2);
      const [lineIdx, charIdx] = c.startLine;
      expect(lineIdx).toBeGreaterThanOrEqual(0);
      expect(lineIdx).toBeLessThan(c.map.length);
      expect(charIdx).toBeGreaterThanOrEqual(0);
      expect(charIdx).toBeLessThan(c.map[lineIdx].length);
    }
  });

  it('all circuits have valid direction values', () => {
    for (const c of CIRCUITS) {
      expect(['Clockwise', 'Anti-clockwise']).toContain(c.direction);
    }
  });

  it('all circuits have positive length and turns', () => {
    for (const c of CIRCUITS) {
      expect(c.lengthKm).toBeGreaterThan(0);
      expect(c.turns).toBeGreaterThan(0);
      expect(c.firstHeld).toBeGreaterThan(1900);
    }
  });

  it('all circuit names are unique', () => {
    const names = CIRCUITS.map((c) => c.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

describe('Circuit matching logic', () => {
  // Mirror the findCircuits logic from circuit.ts
  function findCircuits(query: string): Circuit[] {
    const q = query.toLowerCase();
    return CIRCUITS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.gpName.toLowerCase().includes(q)
    );
  }

  it('matches case-insensitively', () => {
    expect(findCircuits('MONZA')).toHaveLength(1);
    expect(findCircuits('Monza')).toHaveLength(1);
    expect(findCircuits('monza')).toHaveLength(1);
    expect(findCircuits('MoNzA')).toHaveLength(1);
  });

  it('matches by circuit short name', () => {
    expect(findCircuits('silverstone')).toHaveLength(1);
    expect(findCircuits('silverstone')[0].name).toBe('Silverstone');
  });

  it('matches by full name', () => {
    const matches = findCircuits('marina');
    // "marina" appears in both Marina Bay Street Circuit and Yas Marina Circuit
    expect(matches).toHaveLength(2);
    const names = matches.map((m) => m.name);
    expect(names).toContain('Yas Marina Circuit');
    expect(names).toContain('Singapore');
  });

  it('matches by Grand Prix name', () => {
    const matches = findCircuits('italian grand prix');
    expect(matches).toHaveLength(1);
    expect(matches[0].name).toBe('Monza');
  });

  it('matches partial names', () => {
    const suzuka = findCircuits('suz');
    expect(suzuka).toHaveLength(1);
    expect(suzuka[0].name).toBe('Suzuka');

    const monte = findCircuits('monte');
    expect(monte).toHaveLength(1);
    expect(monte[0].name).toBe('Monte Carlo');
  });

  it('returns empty array for no match', () => {
    expect(findCircuits('nonexistent')).toEqual([]);
    expect(findCircuits('foobar')).toEqual([]);
    expect(findCircuits('xyz123')).toEqual([]);
  });

  it('handles "spa" matching Spa-Francorchamps', () => {
    const matches = findCircuits('spa');
    // "spa" matches Spa-Francorchamps, plus "Spanish Grand Prix" (Catalunya, Madring)
    const names = matches.map((m) => m.name);
    expect(names).toContain('Spa-Francorchamps');
    expect(names).toContain('Catalunya');
    expect(names).toContain('Madring');
  });

  it('handles partial "grand" matching multiple circuits', () => {
    const matches = findCircuits('grand prix');
    expect(matches.length).toBeGreaterThan(1);
  });
});
