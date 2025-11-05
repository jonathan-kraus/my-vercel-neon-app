// utils/locations.ts
import { isFeatureEnabled } from './featureFlags';

export interface Location {
  name: string;
  lat: number;
  lon: number;
  displayName: string;
  flag: string;
}

export const LOCATIONS: Record<string, Location> = {
  kop: {
    name: 'kop',
    lat: 40.104234,
    lon: -75.41397,
    displayName: 'King of Prussia, PA',
    flag: 'LOCATION_KOP',
  },
  newYork: {
    name: 'newYork',
    lat: 40.7128,
    lon: -74.006,
    displayName: 'New York, NY',
    flag: 'LOCATION_NEW_YORK',
  },
  sanFrancisco: {
    name: 'sanFrancisco',
    lat: 37.7749,
    lon: -122.4194,
    displayName: 'San Francisco, CA',
    flag: 'LOCATION_SAN_FRANCISCO',
  },
  chicago: {
    name: 'chicago',
    lat: 41.8781,
    lon: -87.6298,
    displayName: 'Chicago, IL',
    flag: 'LOCATION_CHICAGO',
  },
};

/**
 * Get all available locations
 */
export function getAvailableLocations(): Location[] {
  return Object.values(LOCATIONS).filter((location) => isFeatureEnabled(location.flag as any));
}

/**
 * Get the currently active location (first enabled one, or default to King of Prussia)
 */
export function getActiveLocation(): Location {
  const available = getAvailableLocations();
  return available.length > 0 ? available[0] : LOCATIONS.kop;
}

/**
 * Get location by name
 */
export function getLocationByName(name: string): Location | undefined {
  return LOCATIONS[name];
}

/**
 * Format location for Tomorrow.io API (location=lat,lon)
 */
export function formatLocationForTomorrowIO(location: Location): string {
  return `${location.lat},${location.lon}`;
}

/**
 * Format location for OpenStreetMap (lat,lon)
 */
export function formatLocationForOSM(location: Location): string {
  return `${location.lat},${location.lon}`;
}
