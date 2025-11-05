import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDailyForecast } from '../app/lib/GetDailyForecast';
import { isFeatureEnabled } from '../app/utils/featureFlags';

// Mock external dependencies
vi.mock('../app/utils/featureFlags', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('../app/lib/db', () => ({
  db: {
    log: {
      create: vi.fn(),
    },
    weatherLog: {
      create: vi.fn(),
    },
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('getDailyForecast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.TOMORROW_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up environment variables
    delete process.env.TOMORROW_API_KEY;
  });

  describe('Mock Data Mode', () => {
    beforeEach(() => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true); // WEATHER_MOCK_DATA enabled
    });

    it('returns mock forecast data when WEATHER_MOCK_DATA is enabled', async () => {
      const result = await getDailyForecast('test-request-id');

      expect(result).toHaveProperty('forecast');
      expect(result).toHaveProperty('maxRainAccumulation');
      expect(result.forecast).toHaveLength(7); // 7 days of forecast

      // Check that forecast contains expected properties
      const firstDay = result.forecast[0];
      expect(firstDay).toHaveProperty('time');
      expect(firstDay).toHaveProperty('temperatureMax');
      expect(firstDay).toHaveProperty('temperatureMin');
      expect(firstDay).toHaveProperty('precipitation');
      expect(firstDay).toHaveProperty('conditions');
      expect(firstDay).toHaveProperty('rainAccumulationAvg');
    });

    it('includes requestId in mock forecast data', async () => {
      const requestId = 'test-123';
      const result = await getDailyForecast(requestId);

      result.forecast.forEach(day => {
        expect(day.requestId).toBe(requestId);
      });
    });

    it('returns error object indicating mock data usage', async () => {
      const result = await getDailyForecast();

      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('unknown');
      expect(result.error?.message).toContain('Using mock weather data');
    });
  });

  describe('Real API Mode', () => {
    beforeEach(() => {
      vi.mocked(isFeatureEnabled).mockReturnValue(false); // WEATHER_MOCK_DATA disabled
    });

    it('throws error when TOMORROW_API_KEY is not set', async () => {
      // Temporarily remove API key
      const originalKey = process.env.TOMORROW_API_KEY;
      delete process.env.TOMORROW_API_KEY;

      await expect(getDailyForecast()).rejects.toThrow('TOMORROW_API_KEY not set');

      // Restore API key
      process.env.TOMORROW_API_KEY = originalKey;
    });

    it('handles API rate limit errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const result = await getDailyForecast();

      expect(result.forecast).toHaveLength(0);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('rate_limit');
      expect(result.error?.message).toContain('rate limit');
      expect(result.error?.statusCode).toBe(429);
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getDailyForecast();

      expect(result.forecast).toHaveLength(0);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('network');
    });

    it('handles API server errors (5xx)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await getDailyForecast();

      expect(result.forecast).toHaveProperty('length', 0);
      expect(result.error?.type).toBe('api_error');
      expect(result.error?.message).toContain('temporarily unavailable');
      expect(result.error?.statusCode).toBe(500);
    });

    it('processes valid API response correctly', async () => {
      const mockApiResponse = {
        timelines: {
          daily: [
            {
              time: '2025-11-05T00:00:00Z',
              values: {
                temperatureMax: 75,
                temperatureMin: 55,
                precipitationProbability: 20,
                weatherCodeMax: 1000,
                weatherCodeMin: 1000,
                rainAccumulationAvg: 0.1,
                rainAccumulationMax: 0.5,
                rainAccumulationMin: 0,
                rainAccumulationSum: 0.3,
                sunriseTime: '2025-11-05T06:30:00Z',
                sunsetTime: '2025-11-05T17:45:00Z',
                moonriseTime: '2025-11-05T19:15:00Z',
                moonsetTime: '2025-11-05T07:30:00Z',
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await getDailyForecast();

      expect(result.forecast).toHaveLength(1);
      expect(result.maxRainAccumulation).toBe(0.3);

      const day = result.forecast[0];
      expect(day.temperatureMax).toBe(75);
      expect(day.temperatureMin).toBe(55);
      expect(day.precipitation).toBe(20);
      expect(day.conditions.day).toBe(1000);
      expect(day.conditions.night).toBe(1000);
      expect(day.sunriseTime).toBe('2025-11-05T06:30:00Z');
      expect(day.sunsetTime).toBe('2025-11-05T17:45:00Z');
    });

    it('handles malformed API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}), // Empty response
      });

      const result = await getDailyForecast();

      expect(result.forecast).toHaveLength(0);
      expect(result.maxRainAccumulation).toBe(0);
    });
  });

  describe('Location Parameter', () => {
    beforeEach(() => {
      vi.mocked(isFeatureEnabled).mockReturnValue(false); // Real API mode
    });

    it('accepts and uses location parameter', async () => {
      const customLocation = {
        name: 'test',
        lat: 40.7128,
        lon: -74.006,
        displayName: 'Test City',
        flag: 'LOCATION_TEST',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          timelines: {
            daily: [{
              time: '2025-11-05T00:00:00Z',
              values: {
                temperatureMax: 70,
                temperatureMin: 50,
                precipitationProbability: 10,
                weatherCodeMax: 1000,
                weatherCodeMin: 1000,
                rainAccumulationAvg: 0,
                rainAccumulationMax: 0,
                rainAccumulationMin: 0,
                rainAccumulationSum: 0,
              },
            }],
          },
        }),
      });

      const result = await getDailyForecast('test-id', customLocation);

      expect(result.forecast).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('location=40.7128,-74.006')
      );
    });
  });
});