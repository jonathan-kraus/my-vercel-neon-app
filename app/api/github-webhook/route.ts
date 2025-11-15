import { NextRequest } from 'next/server';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';

const requestId = generateUUID();
const log = createLogger('app/api/github-webhook/route.ts', requestId);
export async function POST(req: NextRequest) {
  const event = req.headers.get('x-github-event');
  const payload = await req.json();

  if (event === 'pull_request' && payload.action === 'opened') {
    const pr = payload.pull_request;
    const isRenovate = pr.user?.login === 'renovate[bot]';

    if (isRenovate) {
      const branch = pr.head.ref;
      const title = pr.title;
      const createdAt = pr.created_at;

      const packageGroup = branch.replace('renovate/', '');
      const severity = title.includes('major') ? 'warning' : 'info';

      log.info('dependency.update', {
        source: 'renovate',
        packageGroup,
        branch,
        title,
        createdAt,
        severity,
      });
    }
  }

  return new Response('OK', { status: 200 });
}
