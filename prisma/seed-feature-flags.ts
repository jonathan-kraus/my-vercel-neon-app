import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const flags = [
  // Weather features
  {
    name: 'WEATHER_AUTO_REFRESH',
    enabled: false,
    description: 'Auto-refresh weather data',
    category: 'weather',
  },
  {
    name: 'WEATHER_LOCATION_DISPLAY',
    enabled: true,
    description: 'Show location names on weather cards',
    category: 'weather',
  },
  {
    name: 'WEATHER_MOCK_DATA',
    enabled: false,
    description: 'Use mock weather data instead of API calls',
    category: 'weather',
  },

  // Location features
  {
    name: 'LOCATION_KOP',
    enabled: false,
    description: 'Enable King of Prussia location',
    category: 'location',
  },
  {
    name: 'LOCATION_NEW_YORK',
    enabled: true,
    description: 'Enable New York location',
    category: 'location',
  },
  {
    name: 'LOCATION_SAN_FRANCISCO',
    enabled: false,
    description: 'Enable San Francisco location',
    category: 'location',
  },
  {
    name: 'LOCATION_BROOKLINE',
    enabled: false,
    description: 'Enable Brookline location',
    category: 'location',
  },
  {
    name: 'LOCATION_WILLIAMSTOWN',
    enabled: false,
    description: 'Enable Williamstown location',
    category: 'location',
  },

  // Logging features
  {
    name: 'VERBOSE_LOGGING',
    enabled: true,
    description: 'Enable detailed debug logs',
    category: 'logging',
  },
  {
    name: 'LOG_REQUEST_TRACING',
    enabled: true,
    description: 'Enable request ID tracing',
    category: 'logging',
  },

  // Admin features
  { name: 'ADMIN_TOOLS', enabled: true, description: 'Enable admin tools UI', category: 'admin' },
  {
    name: 'ADVANCED_ANALYTICS',
    enabled: false,
    description: 'Enable advanced analytics features',
    category: 'admin',
  },

  // Email features
  {
    name: 'EMAIL_NOTIFICATIONS',
    enabled: true,
    description: 'Enable email notifications',
    category: 'email',
  },
  {
    name: 'EMAIL_TEMPLATES',
    enabled: false,
    description: 'Enable email template system',
    category: 'email',
  },

  // UI features
  { name: 'DARK_MODE', enabled: false, description: 'Enable dark mode', category: 'ui' },
  {
    name: 'NEW_UI_COMPONENTS',
    enabled: false,
    description: 'Enable experimental UI components',
    category: 'ui',
  },

  // Performance features
  { name: 'CACHING', enabled: false, description: 'Enable caching', category: 'performance' },
  {
    name: 'LAZY_LOADING',
    enabled: false,
    description: 'Enable lazy loading',
    category: 'performance',
  },
];

async function main() {
  console.log('Seeding feature flags...');

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: {
        description: flag.description,
        category: flag.category,
      },
      create: flag,
    });
    console.log(`✓ ${flag.name}`);
  }

  console.log('Feature flags seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
