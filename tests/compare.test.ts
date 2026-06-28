import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, clearCache } from '../src/api/client.js';
import type { Meeting, Session, Driver, ChampionshipDriver } from '../src/api/types.js';

const mockMeeting: Meeting = {
  meeting_key: 1254,
  meeting_name: 'Australian Grand Prix',
  meeting_official_name: 'FORMULA 1 AUSTRALIAN GRAND PRIX 2025',
  location: 'Melbourne',
  country_key: 5,
  country_code: 'AUS',
  country_name: 'Australia',
  country_flag: '',
  circuit_key: 10,
  circuit_short_name: 'Melbourne',
  circuit_type: 'Street',
  circuit_info_url: '',
  circuit_image: '',
  gmt_offset: '11:00:00',
  date_start: '2025-03-14T01:30:00+00:00',
  date_end: '2025-03-16T06:00:00+00:00',
  year: 2025,
  is_cancelled: false,
};

const mockRaceSession: Session = {
  session_key: 9686,
  session_type: 'Race',
  session_name: 'Race',
  date_start: '2025-03-16T04:00:00+00:00',
  date_end: '2025-03-16T06:00:00+00:00',
  meeting_key: 1254,
  circuit_key: 10,
  circuit_short_name: 'Melbourne',
  country_key: 5,
  country_code: 'AUS',
  country_name: 'Australia',
  location: 'Melbourne',
  gmt_offset: '11:00:00',
  year: 2025,
  is_cancelled: false,
};

const mockDrivers: Driver[] = [
  {
    meeting_key: 1254,
    session_key: 9686,
    driver_number: 1,
    broadcast_name: 'M VERSTAPPEN',
    full_name: 'Max VERSTAPPEN',
    name_acronym: 'VER',
    team_name: 'Red Bull Racing',
    team_colour: '3671C6',
    first_name: 'Max',
    last_name: 'Verstappen',
    headshot_url: '',
    country_code: 'NED',
  },
  {
    meeting_key: 1254,
    session_key: 9686,
    driver_number: 44,
    broadcast_name: 'L HAMILTON',
    full_name: 'Lewis HAMILTON',
    name_acronym: 'HAM',
    team_name: 'Ferrari',
    team_colour: 'DC0000',
    first_name: 'Lewis',
    last_name: 'Hamilton',
    headshot_url: '',
    country_code: 'GBR',
  },
];

const mockChampDrivers: ChampionshipDriver[] = [
  {
    meeting_key: 1254,
    session_key: 9686,
    driver_number: 1,
    position_start: 1,
    position_current: 1,
    points_start: 250,
    points_current: 250,
  },
  {
    meeting_key: 1254,
    session_key: 9686,
    driver_number: 44,
    position_start: 3,
    position_current: 2,
    points_start: 180,
    points_current: 200,
  },
];

describe('compareCommand', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows head-to-head comparison for two valid drivers', async () => {
    vi.spyOn(api, 'getMeetings').mockResolvedValueOnce([mockMeeting]);
    vi.spyOn(api, 'getSessions').mockResolvedValueOnce([mockRaceSession]);
    vi.spyOn(api, 'getDrivers').mockResolvedValueOnce(mockDrivers);
    vi.spyOn(api, 'getChampionshipDrivers').mockResolvedValueOnce(mockChampDrivers);

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.map(String).join(' '));
    });

    const { compareCommand } = await import('../src/commands/compare.js');
    await compareCommand('verstappen', 'hamilton', 2025, false);

    const output = logs.join('\n');
    expect(output).toContain('VERSTAPPEN');
    expect(output).toContain('HAMILTON');
    expect(output).toContain('Red Bull Racing');
    expect(output).toContain('Ferrari');
    expect(output).toContain('250'); // Verstappen points
    expect(output).toContain('200'); // Hamilton points
  });

  it('outputs JSON when jsonMode is true', async () => {
    vi.spyOn(api, 'getMeetings').mockResolvedValueOnce([mockMeeting]);
    vi.spyOn(api, 'getSessions').mockResolvedValueOnce([mockRaceSession]);
    vi.spyOn(api, 'getDrivers').mockResolvedValueOnce(mockDrivers);
    vi.spyOn(api, 'getChampionshipDrivers').mockResolvedValueOnce(mockChampDrivers);

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.map(String).join(' '));
    });

    const { compareCommand } = await import('../src/commands/compare.js');
    await compareCommand('verstappen', 'hamilton', 2025, true);

    const output = logs.join('\n');
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('driverA');
    expect(parsed).toHaveProperty('driverB');
    expect(parsed.driverA.name).toBe('Max VERSTAPPEN');
    expect(parsed.driverB.name).toBe('Lewis HAMILTON');
    expect(parsed).toHaveProperty('pointsDifference');
  });

  it('exits with error for unknown driver', async () => {
    vi.spyOn(api, 'getMeetings').mockResolvedValueOnce([mockMeeting]);
    vi.spyOn(api, 'getSessions').mockResolvedValueOnce([mockRaceSession]);
    vi.spyOn(api, 'getDrivers').mockResolvedValueOnce(mockDrivers);
    vi.spyOn(api, 'getChampionshipDrivers').mockResolvedValueOnce(mockChampDrivers);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const { compareCommand } = await import('../src/commands/compare.js');

    try {
      await compareCommand('nobody', 'hamilton', 2025, false);
    } catch (e) {
      // expected from mocked exit
    }

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
