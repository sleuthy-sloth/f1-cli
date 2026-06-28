import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, clearCache } from '../src/api/client.js';
import type { Meeting, Session, Driver, Lap } from '../src/api/types.js';

// We import the module under test after mocks are set up
const mockMeeting: Meeting = {
  meeting_key: 1254,
  meeting_name: 'Australian Grand Prix',
  meeting_official_name: 'FORMULA 1 LOUIS VUITTON AUSTRALIAN GRAND PRIX 2025',
  location: 'Melbourne',
  country_key: 5,
  country_code: 'AUS',
  country_name: 'Australia',
  country_flag: 'https://example.com/aus.png',
  circuit_key: 10,
  circuit_short_name: 'Melbourne',
  circuit_type: 'Temporary - Street',
  circuit_info_url: 'https://example.com/melbourne',
  circuit_image: 'https://example.com/melb.png',
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
    driver_number: 44,
    broadcast_name: 'L HAMILTON',
    full_name: 'Lewis HAMILTON',
    name_acronym: 'HAM',
    team_name: 'Ferrari',
    team_colour: 'DC0000',
    first_name: 'Lewis',
    last_name: 'Hamilton',
    headshot_url: 'https://example.com/ham.png',
    country_code: 'GBR',
  },
  {
    meeting_key: 1254,
    session_key: 9686,
    driver_number: 63,
    broadcast_name: 'G RUSSELL',
    full_name: 'George RUSSELL',
    name_acronym: 'RUS',
    team_name: 'Mercedes',
    team_colour: '00D2BE',
    first_name: 'George',
    last_name: 'Russell',
    headshot_url: 'https://example.com/rus.png',
    country_code: 'GBR',
  },
];

const mockLaps: Lap[] = [
  {
    session_key: 9686,
    driver_number: 44,
    lap_number: 1,
    lap_duration: 92.456,
    duration_sector_1: 30.123,
    duration_sector_2: 31.456,
    duration_sector_3: 30.877,
    is_pit_out_lap: true,
    i1_speed_trap: 280,
    i2_speed_trap: 295,
    st_speed_trap: 310,
    date_start: '2025-03-16T04:01:00+00:00',
  },
  {
    session_key: 9686,
    driver_number: 44,
    lap_number: 2,
    lap_duration: 89.123,
    duration_sector_1: 29.456,
    duration_sector_2: 30.789,
    duration_sector_3: 28.878,
    is_pit_out_lap: false,
    i1_speed_trap: 285,
    i2_speed_trap: 300,
    st_speed_trap: 315,
    date_start: '2025-03-16T04:03:00+00:00',
  },
  {
    session_key: 9686,
    driver_number: 63,
    lap_number: 1,
    lap_duration: 91.789,
    duration_sector_1: 29.890,
    duration_sector_2: 31.234,
    duration_sector_3: 30.665,
    is_pit_out_lap: true,
    i1_speed_trap: 278,
    i2_speed_trap: 292,
    st_speed_trap: 308,
    date_start: '2025-03-16T04:01:30+00:00',
  },
  {
    session_key: 9686,
    driver_number: 63,
    lap_number: 2,
    lap_duration: 88.456,
    duration_sector_1: 29.123,
    duration_sector_2: 30.456,
    duration_sector_3: 28.877,
    is_pit_out_lap: false,
    i1_speed_trap: 287,
    i2_speed_trap: 302,
    st_speed_trap: 318,
    date_start: '2025-03-16T04:03:30+00:00',
  },
];

describe('lapsCommand', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows best lap per driver for the latest completed race', async () => {
    vi.spyOn(api, 'getMeetings').mockResolvedValueOnce([mockMeeting]);
    vi.spyOn(api, 'getSessions').mockResolvedValueOnce([mockRaceSession]);
    vi.spyOn(api, 'getLaps').mockResolvedValueOnce(mockLaps);
    vi.spyOn(api, 'getDrivers').mockResolvedValueOnce(mockDrivers);

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.map(String).join(' '));
    });

    const { lapsCommand } = await import('../src/commands/laps.js');
    await lapsCommand(2025, undefined, false);

    const output = logs.join('\n');
    // Table shows last names in uppercase
    expect(output).toContain('HAMILTON');
    expect(output).toContain('RUSSELL');
    expect(output).toContain('Ferrari');
    expect(output).toContain('Mercedes');
  });

  it('outputs JSON when jsonMode is true', async () => {
    vi.spyOn(api, 'getMeetings').mockResolvedValueOnce([mockMeeting]);
    vi.spyOn(api, 'getSessions').mockResolvedValueOnce([mockRaceSession]);
    vi.spyOn(api, 'getLaps').mockResolvedValueOnce(mockLaps);
    vi.spyOn(api, 'getDrivers').mockResolvedValueOnce(mockDrivers);

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.map(String).join(' '));
    });

    const { lapsCommand } = await import('../src/commands/laps.js');
    await lapsCommand(2025, undefined, true);

    const output = logs.join('\n');
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('drivers');
    expect(parsed.drivers).toHaveLength(2);
    expect(parsed.drivers[0]).toHaveProperty('driver');
  });

  it('filters by driver number when provided', async () => {
    vi.spyOn(api, 'getMeetings').mockResolvedValueOnce([mockMeeting]);
    vi.spyOn(api, 'getSessions').mockResolvedValueOnce([mockRaceSession]);
    vi.spyOn(api, 'getLaps').mockResolvedValueOnce(mockLaps);
    vi.spyOn(api, 'getDrivers').mockResolvedValueOnce(mockDrivers);

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.map(String).join(' '));
    });

    const { lapsCommand } = await import('../src/commands/laps.js');
    await lapsCommand(2025, 44, false);

    const output = logs.join('\n');
    // Driver detail view shows full name
    expect(output).toContain('Lewis HAMILTON');
    expect(output).not.toContain('RUSSELL');
  });
});
