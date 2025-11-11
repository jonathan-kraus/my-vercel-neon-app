// Weather utility functions for converting weather codes to icons and labels

export function getIcon(code: number): string {
  // Weather code mapping based on Tomorrow.io API
  const iconMap: Record<number, string> = {
    1000: '☀️', // Clear
    1001: '☁️', // Cloudy
    1100: '⛅', // Mostly Clear
    1101: '☁️', // Partly Cloudy
    1102: '☁️', // Mostly Cloudy
    2000: '🌫️', // Fog
    2100: '🌫️', // Light Fog
    3000: '🌧️', // Light Rain
    3001: '🌧️', // Rain
    3002: '🌧️', // Heavy Rain
    4000: '🌧️', // Light Drizzle
    4001: '🌧️', // Drizzle
    5000: '🌨️', // Snow
    5001: '🌨️', // Flurries
    5100: '🌨️', // Light Snow
    5101: '❄️', // Heavy Snow
    6000: '🌧️', // Freezing Drizzle
    6001: '🌧️', // Freezing Rain
    6200: '🌨️', // Light Freezing Rain
    6201: '🌨️', // Heavy Freezing Rain
    7000: '🌧️', // Ice Pellets
    7101: '🌧️', // Heavy Ice Pellets
    7102: '🌧️', // Light Ice Pellets
    8000: '⛈️', // Thunderstorm
  };

  return iconMap[code] || '❓';
}

export function getLabel(code: number): string {
  // Weather code mapping based on Tomorrow.io API
  const labelMap: Record<number, string> = {
    1000: 'Clear',
    1001: 'Cloudy',
    1100: 'Mostly Clear',
    1101: 'Partly Cloudy',
    1102: 'Mostly Cloudy',
    2000: 'Fog',
    2100: 'Light Fog',
    3000: 'Light Rain',
    3001: 'Rain',
    3002: 'Heavy Rain',
    4000: 'Light Drizzle',
    4001: 'Drizzle',
    5000: 'Snow',
    5001: 'Flurries',
    5100: 'Light Snow',
    5101: 'Heavy Snow',
    6000: 'Freezing Drizzle',
    6001: 'Freezing Rain',
    6200: 'Light Freezing Rain',
    6201: 'Heavy Freezing Rain',
    7000: 'Ice Pellets',
    7101: 'Heavy Ice Pellets',
    7102: 'Light Ice Pellets',
    8000: 'Thunderstorm',
  };

  return labelMap[code] || 'Unknown';
}

// Calculate moon phase (0 = new moon, 0.5 = full moon, 1 = new moon again)
export function getMoonPhase(date: Date = new Date()): {
  phase: number;
  name: string;
  emoji: string;
} {
  // Approximate calculation based on Julian day
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Julian day calculation
  let jd =
    367 * year -
    Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) +
    Math.floor((275 * month) / 9) +
    day +
    1721013.5;

  // Days since last new moon (approximate, using a known new moon date)
  const knownNewMoon = 2451549.5; // Jan 6, 2000
  const daysSinceNewMoon = (jd - knownNewMoon) % 29.53058867;
  const phase = daysSinceNewMoon / 29.53058867;

  let name: string;
  let emoji: string;

  if (phase < 0.03 || phase > 0.97) {
    name = 'New Moon';
    emoji = '🌑';
  } else if (phase < 0.22) {
    name = 'Waxing Crescent';
    emoji = '🌒';
  } else if (phase < 0.28) {
    name = 'First Quarter';
    emoji = '🌓';
  } else if (phase < 0.47) {
    name = 'Waxing Gibbous';
    emoji = '🌔';
  } else if (phase < 0.53) {
    name = 'Full Moon';
    emoji = '🌕';
  } else if (phase < 0.72) {
    name = 'Waning Gibbous';
    emoji = '🌖';
  } else if (phase < 0.78) {
    name = 'Last Quarter';
    emoji = '🌗';
  } else {
    name = 'Waning Crescent';
    emoji = '🌘';
  }

  return { phase, name, emoji };
}

// Format time until a given date
export function getTimeUntil(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff < 0) {
    // Time has passed, get next occurrence (add 24 hours)
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return getTimeUntil(nextDate);
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
