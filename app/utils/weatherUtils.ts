export const weatherCodeMap: Record<number, { label: string; icon: string }> = {
  1000: { label: 'Clear', icon: '☀️' },
  1100: { label: 'Mostly Clear', icon: '🌤️' },
  1101: { label: 'Partly Cloudy', icon: '⛅' },
  1102: { label: 'Mostly Cloudy', icon: '🌥️' },
  1001: { label: 'Cloudy', icon: '☁️' },
  2000: { label: 'Fog', icon: '🌫️' },
  2100: { label: 'Light Fog', icon: '🌫️' },
  4000: { label: 'Drizzle', icon: '🌦️' },
  4001: { label: 'Rain', icon: '🌧️' },
  4200: { label: 'Light Rain', icon: '🌦️' },
  4201: { label: 'Heavy Rain', icon: '🌧️' },
  5000: { label: 'Snow', icon: '🌨️' },
  5100: { label: 'Light Snow', icon: '🌨️' },
  5101: { label: 'Heavy Snow', icon: '❄️' },
  6000: { label: 'Freezing Drizzle', icon: '🌧️' },
  6001: { label: 'Freezing Rain', icon: '🌧️' },
  6200: { label: 'Light Freezing Rain', icon: '🌧️' },
  6201: { label: 'Heavy Freezing Rain', icon: '🌧️' },
  7000: { label: 'Ice Pellets', icon: '🌨️' },
  7101: { label: 'Heavy Ice Pellets', icon: '❄️' },
  7102: { label: 'Light Ice Pellets', icon: '🌨️' },
  8000: { label: 'Thunderstorm', icon: '⛈️' },
};

export function getIcon(code?: number): string {
  return weatherCodeMap[code ?? -1]?.icon ?? '❓';
}

export function getLabel(code?: number): string {
  return weatherCodeMap[code ?? -1]?.label ?? 'Unknown';
}
