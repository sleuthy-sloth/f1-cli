import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, clearCache } from '../src/api/client.js';
import type { Meeting, Session, SessionResult, Driver } from '../src/api/types.js';

const BASE_URL = 'https://api.openf1.org/v1';

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

describe('API Client', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMeetings', () => {
    it('fetches meetings by year', async () => {
      const mockData = [mockMeeting];
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await api.getMeetings({ year: 2025 });
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/meetings?year=2025`);
    });

    it('fetches all meetings when no params', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      const result = await api.getMeetings();
      expect(result).toEqual([]);
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/meetings`);
    });

    it('caches repeated requests', async () => {
      const mockData = [mockMeeting];
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result1 = await api.getMeetings({ year: 2025 });
      const result2 = await api.getMeetings({ year: 2025 });

      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('throws on HTTP error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(api.getMeetings()).rejects.toThrow(
        'API request failed: 500 Internal Server Error'
      );
    });

    it('throws 404-specific message', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(api.getMeetings()).rejects.toThrow(
        'No data found for the requested parameters.'
      );
    });
  });

  describe('getSessions', () => {
    it('fetches sessions by meeting_key', async () => {
      const mockData: Session[] = [
        {
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
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await api.getSessions({ meeting_key: 1254 });
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/sessions?meeting_key=1254`);
    });
  });

  describe('getSessionResults', () => {
    it('fetches race results', async () => {
      const mockData: SessionResult[] = [
        {
          position: 1,
          driver_number: 44,
          number_of_laps: 66,
          points: 25,
          dnf: false,
          dns: false,
          dsq: false,
          duration: 5548.105,
          gap_to_leader: 0,
          meeting_key: 1254,
          session_key: 9686,
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await api.getSessionResults({ session_key: 9686 });
      expect(result).toEqual(mockData);
    });
  });

  describe('getDrivers', () => {
    it('fetches drivers for a session', async () => {
      const mockData: Driver[] = [
        {
          meeting_key: 1287,
          session_key: 11307,
          driver_number: 1,
          broadcast_name: 'L NORRIS',
          full_name: 'Lando NORRIS',
          name_acronym: 'NOR',
          team_name: 'McLaren',
          team_colour: 'F47600',
          first_name: 'Lando',
          last_name: 'Norris',
          headshot_url: 'https://example.com/norris.png',
          country_code: null,
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await api.getDrivers({ session_key: 11307 });
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/drivers?session_key=11307`);
    });
  });

  describe('getChampionshipDrivers', () => {
    it('fetches championship standings', async () => {
      const mockData = [
        {
          meeting_key: 1287,
          session_key: 11307,
          driver_number: 12,
          position_start: 1,
          position_current: 1,
          points_start: 156,
          points_current: 156,
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await api.getChampionshipDrivers({ session_key: 11307 });
      expect(result).toEqual(mockData);
    });
  });

  describe('getChampionshipTeams', () => {
    it('fetches constructor standings', async () => {
      const mockData = [
        {
          meeting_key: 1287,
          session_key: 11307,
          team_name: 'Mercedes',
          position_start: 1,
          position_current: 1,
          points_start: 244,
          points_current: 262,
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await api.getChampionshipTeams({ session_key: 11307 });
      expect(result).toEqual(mockData);
    });
  });
});
