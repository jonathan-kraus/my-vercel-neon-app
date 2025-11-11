import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeather } from '../app/lib/fetchWeather';

// Mock dependencies
vi.mock('../app/lib/db', () => ({
  db: {
    log: {
      create: vi.fn().mockResolvedValue({}),
    },
    weatherLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('../app/utils/locations', () => ({
  getActiveLocation: vi.fn(() => ({
    name: 'kop',
    lat: 40.104234,
    lon: -75.41397,
    displayName: 'King of Prussia, PA',
    flag: 'LOCATION_KOP',
  })),
  formatLocationForTomorrowIO: vi.fn((location) => `${location.lat},${location.lon}`),
  formatLocationForOSM: vi.fn((location) => ({ lat: location.lat, lon: location.lon })),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('fetchWeather', () => {
  const mockWeatherApiResponse = {
    data: {
      values: {
        temperature: 72,
        humidity: 65,
        windSpeed: 8,
        windGust: 12,
        precipitationProbability: 20,
        weatherCode: 1001,
        rainAccumulationAvg: 0.1,
        rainAccumulationMax: 0.3,
        rainAccumulationMin: 0,
        rainAccumulationSum: 0.2,
      },
    },
    location: {
      name: 'King of Prussia',
      lat: 40.104234,
      lon: -75.41397,
    },
  };

  const mockNominatimResponse = {
    address: {
      city: 'King of Prussia',
      county: 'Montgomery County',
      state: 'Pennsylvania',
      country: 'United States',
    },
    display_name: 'King of Prussia, Montgomery County, Pennsylvania, United States',
  };

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

  describe('Successful API calls', () => {
    it('fetches weather data from Tomorrow.io API', async () => {
      // Set up successful mocks
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNominatimResponse),
        });

      const result = await fetchWeather('test-request-id');

      expect(mockFetch).toHaveBeenCalledTimes(2);

      // First call should be to Tomorrow.io
      expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining('api.tomorrow.io'));

      expect(result.temperature).toBe(72);
      expect(result.humidity).toBe(65);
      expect(result.windSpeed).toBe(8);
      expect(result.precipitationProbability).toBe(20);
    });

    it('fetches location details from Nominatim API', async () => {
      // Set up successful mocks
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNominatimResponse),
        });

      const result = await fetchWeather('test-request-id');

      // Second call should be to Nominatim
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('nominatim.openstreetmap.org'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('my-vercel-neon-app'),
          }),
        })
      );

      expect(result.locationDetails).toEqual({
        city: 'King of Prussia',
        county: 'Montgomery County',
        state: undefined,
        town: undefined,
        village: undefined,
        hamlet: undefined,
        displayName: 'King of Prussia, Montgomery County, Pennsylvania, United States',
      });
    });

    it('logs weather data to database', async () => {
      // Set up successful mocks
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNominatimResponse),
        });

      const { db } = await import('../app/lib/db');

      await fetchWeather('test-request-id');

      expect(db.weatherLog.create).toHaveBeenCalledWith({
        data: {
          temperature: 72,
          humidity: 65,
          windSpeed: 8,
          windGust: 12,
          precipitationProbability: 20,
          weatherCode: 1001,
          emailSent: false,
          requestId: 'test-request-id',
          location: 'kop', // Add location to expected data
        },
      });
    });

    it('logs API call to database', async () => {
      // Set up successful mocks
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNominatimResponse),
        });

      const { db } = await import('../app/lib/db');

      await fetchWeather('test-request-id');

      // createLogger enriches metadata and doesn't add top-level timestamp
      expect(db.log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'info',
          source: 'fetchWeather',
          message: 'Weather data fetched successfully',
          requestId: 'test-request-id',
          metadata: expect.objectContaining({
            action: 'fetch',
            timestamp: expect.any(String),
            location: expect.any(Object),
          }),
        }),
      });
    });

    it('returns complete weather data structure', async () => {
      // Set up successful mocks
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNominatimResponse),
        });

      const result = await fetchWeather('test-request-id');

      expect(result).toEqual({
        temperature: 72,
        feelsLike: 72, // temperatureApparent defaults to temperature if not provided
        humidity: 65,
        windSpeed: 8,
        windGust: 12,
        precipitationProbability: 20,
        pressure: null, // pressureSurfaceLevel may not be in mock response
        visibility: null, // visibility may not be in mock response
        conditions: {
          day: 1001,
          night: 1001,
        },
        rainAccumulationAvg: 0.1,
        rainAccumulationMax: 0.3,
        rainAccumulationMin: 0,
        rainAccumulationSum: 0.2,
        location: expect.any(Object),
        locationDetails: expect.any(Object),
        emailSent: false,
        lastEmailTimestamp: null,
        requestId: 'test-request-id',
      });
    });
  });

  describe('API Error Handling', () => {
    it('throws error when Tomorrow.io API fails', async () => {
      // Clear all mocks first
      vi.clearAllMocks();
      process.env.TOMORROW_API_KEY = 'test-api-key';

      // Mock Tomorrow.io API to fail
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
      );

      await expect(fetchWeather('test-id')).rejects.toThrow('Failed to fetch weather');
    });

    it('handles Nominatim API failure with fallback location details', async () => {
      // Clear all mocks first
      vi.clearAllMocks();
      process.env.TOMORROW_API_KEY = 'test-api-key';

      // Mock Tomorrow.io API to succeed
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
      );

      // Mock Nominatim API to fail
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      );

      const result = await fetchWeather('test-id');

      // Should still return weather data
      expect(result.temperature).toBe(72);

      // Location details should have fallback
      expect(result.locationDetails).toEqual({
        city: undefined,
        town: undefined,
        village: undefined,
        hamlet: undefined,
        county: undefined,
        displayName: 'kop',
      });
    });

    it('handles malformed Nominatim response', async () => {
      // Clear all mocks first
      vi.clearAllMocks();
      process.env.TOMORROW_API_KEY = 'test-api-key';

      // Mock Tomorrow.io API to succeed
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
      );

      // Mock Nominatim API to return empty response
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}), // Empty response
        })
      );

      const result = await fetchWeather('test-id');

      expect(result.locationDetails).toEqual({
        city: undefined,
        town: undefined,
        village: undefined,
        hamlet: undefined,
        county: undefined,
        displayName: 'kop',
      });
    });
  });

  describe('Custom Location Parameter', () => {
    it('uses provided location instead of active location', async () => {
      // Set up successful mocks
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNominatimResponse),
        });

      const customLocation = {
        name: 'New York, NY',
        lat: 40.7128,
        lon: -74.006,
        displayName: 'New York, NY (40.7128,-74.006)',
        flag: 'LOCATION_NEW_YORK',
      };

      await fetchWeather('test-id', customLocation);

      // Should use custom location coordinates
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('location=40.7128,-74.006')
      );

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('lat=40.7128&lon=-74.006'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('my-vercel-neon-app'),
          }),
        })
      );
    });

    it('uses custom location for fallback location details', async () => {
      const customLocation = {
        name: 'New York, NY',
        lat: 40.7128,
        lon: -74.006,
        displayName: 'New York, NY (40.7128,-74.006)',
        flag: 'LOCATION_NEW_YORK',
      };

      // Clear all mocks first
      vi.clearAllMocks();
      process.env.TOMORROW_API_KEY = 'test-api-key';

      // Mock Tomorrow.io API to succeed
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
      );

      // Mock Nominatim API to fail
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      );

      const result = await fetchWeather('test-id', customLocation);

      expect(result.locationDetails.displayName).toBe('New York, NY');
    });
  });

  describe('Environment Variables', () => {
    it('throws error when TOMORROW_API_KEY is not set', async () => {
      const originalKey = process.env.TOMORROW_API_KEY;
      delete process.env.TOMORROW_API_KEY;

      try {
        await expect(fetchWeather('test-id')).rejects.toThrow('TOMORROW_API_KEY not set');
      } finally {
        process.env.TOMORROW_API_KEY = originalKey;
      }
    });
  });

  describe('Request ID Handling', () => {
    it('generates request ID when not provided', async () => {
      // Set up successful mocks
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}), // Empty response for fallback
        });

      const result = await fetchWeather();

      expect(result.requestId).toBeDefined();
      expect(typeof result.requestId).toBe('string');
    });

    it('uses provided request ID', async () => {
      // Set up successful mocks
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNominatimResponse),
        });

      const requestId = 'custom-request-123';
      const result = await fetchWeather(requestId);

      expect(result.requestId).toBe(requestId);
    });
  });
});
