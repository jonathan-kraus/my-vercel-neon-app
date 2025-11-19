# Request ID & UUID Guide

This document describes the unified request ID (UUID) system used throughout the application for tracking, logging, and debugging.

## Overview

The application uses **UUIDv7** (time-ordered UUIDs) as request identifiers to:

- Track requests across multiple API calls and services
- Correlate log entries for the same logical operation
- Debug issues by filtering logs and database entries by request ID
- Maintain request tracing through the entire application stack

## Core Components

### 1. UUID Generation (`uuidj.ts`)

The central UUID generation module provides:

```typescript
import { generateUUID } from '@/uuidj';

const requestId = generateUUID(); // Generates UUIDv7
```

**Key features:**

- Uses UUIDv7 (time-ordered) for chronological sorting
- Single source of truth for UUID generation
- Also includes middleware (`uuidj()`) that automatically adds `x-request-id` headers to all HTTP requests

### 2. Logger Integration (`app/utils/logger.ts`)

The logger accepts an optional `requestId` parameter to associate all log entries with a specific request:

```typescript
import { createLogger } from '@/app/utils/logger';

// Create a logger bound to a specific source and request ID
const log = createLogger('my-component', requestId);

// All logs will include the request ID
log.info('Processing started');
log.warn('Something unusual happened', { metadata });
log.error('Operation failed', { error });
```

**Database schema:**

```prisma
model Log {
  id        Int      @id @default(autoincrement())
  severity  String   // 'info', 'warning', 'error'
  source    String   // Component/function name
  message   String
  requestId String?  // Optional request tracking ID
  metadata  Json?    // Additional structured data
  createdAt DateTime @default(now())
}
```

### 3. Request ID Propagation Pattern

Request IDs should be passed through the entire request chain:

#### API Route Handler

```typescript
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET(req: Request) {
  // Generate request ID at entry point
  const requestId = generateUUID();
  const log = createLogger('app/api/my-route', requestId);

  log.info('Request received');

  try {
    // Pass requestId to downstream functions
    const result = await processData(requestId);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Request failed', { error });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

#### Service Functions

```typescript
export async function fetchWeather(requestId?: string, location?: Location) {
  // Accept requestId parameter (optional with fallback)
  if (!requestId) requestId = 'requestid-not-passed';
  const log = createLogger('fetchWeather', requestId);

  log.info('Fetching weather data');

  // Store requestId in database records for tracking
  await db.weatherData.create({
    data: {
      temperature: data.temp,
      requestId, // ✅ Store for future correlation
      // ... other fields
    },
  });

  // Return requestId in response
  return {
    temperature: data.temp,
    requestId, // ✅ Include in response
  };
}
```

#### Client Components

```typescript
'use client';

import { useState } from 'react';

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  async function loadWeather() {
    const response = await fetch('/api/weather');
    const data = await response.json();

    // Response includes requestId
    console.log('Request ID:', data.requestId);
    setWeather(data);
  }

  return <div>{/* ... */}</div>;
}
```

## Usage Patterns

### Pattern 1: API Route → Service → Database

```typescript
// 1. API Route (entry point)
export async function GET(req: Request) {
  const requestId = generateUUID();
  const result = await myService(requestId);
  return NextResponse.json(result);
}

// 2. Service function
async function myService(requestId: string) {
  const log = createLogger('myService', requestId);
  log.info('Service called');

  // 3. Database record includes requestId
  await db.myTable.create({
    data: { value: 123, requestId },
  });

  return { success: true, requestId };
}
```

### Pattern 2: Client → API → Service Chain

```typescript
// Client side
const response = await fetch('/api/process', {
  method: 'POST',
  body: JSON.stringify({ data: 'example' }),
});
const { requestId } = await response.json();
console.log('Track this operation:', requestId);

// Server side (API route)
export async function POST(req: Request) {
  const requestId = generateUUID();

  // Multiple service calls with same requestId
  await stepOne(requestId);
  await stepTwo(requestId);
  await stepThree(requestId);

  // All logs/DB entries share same requestId
  return NextResponse.json({ success: true, requestId });
}
```

### Pattern 3: Background Jobs

```typescript
export async function scheduleJob(data: any) {
  const requestId = generateUUID();
  const log = createLogger('backgroundJob', requestId);

  // Store job with requestId
  await db.job.create({
    data: {
      payload: data,
      requestId,
      status: 'pending',
    },
  });

  log.info('Job scheduled', { requestId });
  return requestId; // Return for tracking
}

// Later, when processing the job
export async function processJob(job: Job) {
  // Use job's original requestId
  const log = createLogger('jobProcessor', job.requestId);
  log.info('Processing job');

  // All logs tied to original request
}
```

## Database Schema Patterns

When storing request IDs in database tables:

```prisma
model WeatherData {
  id          Int      @id @default(autoincrement())
  temperature Float
  location    String
  requestId   String?  // ✅ Optional for backward compatibility
  createdAt   DateTime @default(now())

  @@index([requestId]) // ✅ Index for efficient filtering
}

model ApiCall {
  id        Int      @id @default(autoincrement())
  endpoint  String
  method    String
  requestId String   // ✅ Required for API tracking
  duration  Int
  statusCode Int
  createdAt DateTime @default(now())

  @@index([requestId])
}
```

## Querying by Request ID

### Search Logs API

```typescript
// GET /api/logs/search?requestId=abc-123
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');

  const logs = await db.log.findMany({
    where: { requestId: { equals: requestId } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(logs);
}
```

### Admin Log Viewer

```typescript
// View all logs for a specific request
const logs = await db.log.findMany({
  where: { requestId: 'specific-uuid' },
  include: {
    // Include related records if needed
  },
});

// Timeline of a request through the system
logs.forEach((log) => {
  console.log(`[${log.createdAt}] ${log.source}: ${log.message}`);
});
```

## Best Practices

### ✅ DO

1. **Generate at entry point**: Create requestId at the API route level
2. **Pass as parameter**: Thread requestId through all function calls
3. **Store in database**: Include requestId in database records for correlation
4. **Return in responses**: Echo requestId back to clients for debugging
5. **Use consistent naming**: Always use `requestId` (camelCase)
6. **Add database indexes**: Index requestId columns for query performance
7. **Make it optional**: Use `requestId?: string` with fallback for backward compatibility

### ❌ DON'T

1. **Don't regenerate**: Use the same requestId throughout a request chain
2. **Don't forget logging**: Always create logger with requestId when available
3. **Don't skip client returns**: Return requestId to clients for debugging
4. **Don't use different names**: Avoid `request_id`, `req_id`, `uuid` - use `requestId`
5. **Don't make it required everywhere**: Allow existing code to work without requestId

## Debugging Examples

### Finding all operations for a request

```bash
# Search logs
curl 'https://kraus.my.id/api/logs/search?requestId=abc-123'

# Database query
SELECT * FROM "Log" WHERE "requestId" = 'abc-123' ORDER BY "createdAt";
```

### Tracing a weather fetch request

```typescript
// 1. Client initiates request
const response = await fetch('/api/weather');
const data = await response.json();
console.log('Track with:', data.requestId); // "abc-123"

// 2. Search logs in admin panel
// Navigate to: /admin/logs?requestId=abc-123

// 3. See complete timeline:
// [2025-11-18 10:00:00] app/api/weather: Request received
// [2025-11-18 10:00:01] fetchWeather: Fetching weather data
// [2025-11-18 10:00:02] fetchWeather: API call successful
// [2025-11-18 10:00:03] app/api/weather: Response sent
```

## Migration Guide

### Adding requestId to existing code

1. **Update function signature**:

```typescript
// Before
export async function myFunction(data: any) {}

// After
export async function myFunction(data: any, requestId?: string) {
  if (!requestId) requestId = 'legacy-call';
  const log = createLogger('myFunction', requestId);
}
```

2. **Update database schema**:

```prisma
model MyTable {
  // Add as optional field
  requestId String?

  // Add index
  @@index([requestId])
}
```

3. **Update callers gradually**:

```typescript
// Old calls still work
await myFunction(data);

// New calls include requestId
await myFunction(data, requestId);
```

## Environment-Specific Behavior

### Development

- Request IDs visible in console logs
- Full request traces available
- Middleware adds `x-request-id` header to all requests

### Production

- Request IDs in Vercel logs
- Database queries by requestId for debugging
- Response headers include `x-request-id` for client tracking

## Related Files

- `uuidj.ts` - UUID generation and middleware
- `app/utils/logger.ts` - Logging with request ID support
- `app/lib/fetchWeather.ts` - Example of requestId propagation
- `app/api/logs/search/route.ts` - Log search by requestId
- `prisma/schema.prisma` - Database schema with requestId fields

## Common Pitfalls

1. **Forgetting to propagate**: Remember to pass requestId to all nested calls
2. **Regenerating IDs**: Don't create new UUIDs in the middle of a request chain
3. **Missing indexes**: Always index requestId columns for query performance
4. **Inconsistent naming**: Use `requestId` everywhere, not mixed case
5. **Not returning to client**: Always include requestId in API responses for debugging

## Future Enhancements

- [ ] Add request ID to all HTTP response headers automatically
- [ ] Create admin dashboard for request tracing
- [ ] Add request ID to email notifications
- [ ] Implement distributed tracing with OpenTelemetry
- [ ] Add request ID to error tracking (e.g., Sentry)
