import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAvailableLocations,
  getActiveLocation,
  getLocationByName,
  formatLocationForTomorrowIO,
  formatLocationForOSM,
  LOCATIONS
} from '../app/utils/locations';
import { isFeatureEnabled } from '../app/utils/featureFlags';

// Mock feature flags
vi.mock('../app/utils/featureFlags', () => ({
  isFeatureEnabled: vi.fn(),
}));

describe('Location Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableLocations', () => {
    it('returns only locations with enabled feature flags', () => {
      vi.mocked(isFeatureEnabled)
        .mockImplementation((flag: string) => {
          return flag === 'LOCATION_KOP' || flag === 'LOCATION_NEW_YORK';
        });

      const available = getAvailableLocations();

      expect(available).toHaveLength(2);
      expect(available).toContainEqual(LOCATIONS.kop);
      expect(available).toContainEqual(LOCATIONS.newYork);
      expect(available).not.toContainEqual(LOCATIONS.sanFrancisco);
    });

    it('returns empty array when no locations are enabled', () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(false);

      const available = getAvailableLocations();

      expect(available).toHaveLength(0);
    });

    it('returns all locations when all flags are enabled', () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);

      const available = getAvailableLocations();

      expect(available).toHaveLength(5); // kop, newYork, sanFrancisco, chicago, williamstown
      expect(available).toContainEqual(LOCATIONS.kop);
      expect(available).toContainEqual(LOCATIONS.newYork);
      expect(available).toContainEqual(LOCATIONS.sanFrancisco);
      expect(available).toContainEqual(LOCATIONS.chicago);
      expect(available).toContainEqual(LOCATIONS.williamstown);
    });
  });

  describe('getActiveLocation', () => {
    it('returns first available location when locations are enabled', () => {
      vi.mocked(isFeatureEnabled)
        .mockImplementation((flag: string) => flag === 'LOCATION_KOP');

      const active = getActiveLocation();

      expect(active).toEqual(LOCATIONS.kop);
    });

    it('returns King of Prussia as fallback when no locations are enabled', () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(false);

      const active = getActiveLocation();

      expect(active).toEqual(LOCATIONS.kop);
    });

    it('returns first location in priority order', () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);

      const active = getActiveLocation();

      // Should return the first location (kop) since all are enabled
      expect(active).toEqual(LOCATIONS.kop);
    });
  });

  describe('getLocationByName', () => {
    it('returns correct location for valid name', () => {
      const location = getLocationByName('newYork');

      expect(location).toEqual(LOCATIONS.newYork);
      expect(location?.displayName).toBe('New York, NY');
    });

    it('returns undefined for invalid name', () => {
      const location = getLocationByName('invalidCity');

      expect(location).toBeUndefined();
    });

    it('returns correct location for all defined locations', () => {
      Object.keys(LOCATIONS).forEach(name => {
        const location = getLocationByName(name);
        expect(location).toBeDefined();
        expect(location?.name).toBe(name);
      });
    });
  });

  describe('formatLocationForTomorrowIO', () => {
    it('formats location as "lat,lon" string', () => {
      const location = LOCATIONS.newYork; // lat: 40.7128, lon: -74.006

      const formatted = formatLocationForTomorrowIO(location);

      expect(formatted).toBe('40.7128,-74.006');
    });

    it('handles negative coordinates correctly', () => {
      const location = LOCATIONS.sanFrancisco; // lat: 37.7749, lon: -122.4194

      const formatted = formatLocationForTomorrowIO(location);

      expect(formatted).toBe('37.7749,-122.4194');
    });

    it('preserves coordinate precision', () => {
      const location = LOCATIONS.kop; // lat: 40.104234, lon: -75.41397

      const formatted = formatLocationForTomorrowIO(location);

      expect(formatted).toBe('40.104234,-75.41397');
    });
  });

  describe('formatLocationForOSM', () => {
    it('returns object with lat and lon properties', () => {
      const location = LOCATIONS.chicago; // lat: 41.8781, lon: -87.6298

      const formatted = formatLocationForOSM(location);

      expect(formatted).toEqual({
        lat: 41.8781,
        lon: -87.6298,
      });
    });

    it('handles all location types', () => {
      Object.values(LOCATIONS).forEach(location => {
        const formatted = formatLocationForOSM(location);

        expect(formatted).toHaveProperty('lat');
        expect(formatted).toHaveProperty('lon');
        expect(typeof formatted.lat).toBe('number');
        expect(typeof formatted.lon).toBe('number');
      });
    });
  });

  describe('LOCATIONS constant', () => {
    it('contains all expected locations', () => {
      expect(LOCATIONS).toHaveProperty('kop');
      expect(LOCATIONS).toHaveProperty('newYork');
      expect(LOCATIONS).toHaveProperty('sanFrancisco');
      expect(LOCATIONS).toHaveProperty('chicago');
      expect(LOCATIONS).toHaveProperty('williamstown');
    });

    it('each location has required properties', () => {
      Object.values(LOCATIONS).forEach(location => {
        expect(location).toHaveProperty('name');
        expect(location).toHaveProperty('lat');
        expect(location).toHaveProperty('lon');
        expect(location).toHaveProperty('displayName');
        expect(location).toHaveProperty('flag');

        expect(typeof location.lat).toBe('number');
        expect(typeof location.lon).toBe('number');
        expect(typeof location.displayName).toBe('string');
        expect(typeof location.flag).toBe('string');
      });
    });

    it('location coordinates are reasonable', () => {
      Object.values(LOCATIONS).forEach(location => {
        // Latitude should be between -90 and 90
        expect(location.lat).toBeGreaterThanOrEqual(-90);
        expect(location.lat).toBeLessThanOrEqual(90);

        // Longitude should be between -180 and 180
        expect(location.lon).toBeGreaterThanOrEqual(-180);
        expect(location.lon).toBeLessThanOrEqual(180);
      });
    });
  });
});