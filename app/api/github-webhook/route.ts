import { NextRequest } from 'next/server';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';
import crypto from 'crypto';

async function verifySignature(req: NextRequest, body: string): Promise<boolean> {
  const signature = req.headers.get('x-hub-signature-256');
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(body).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(req: NextRequest) {
  const requestId = generateUUID();
  const log = createLogger('app/api/github-webhook/route.ts', requestId);

  // Get raw body for signature verification
  const body = await req.text();

  // Verify GitHub signature
  const isValid = await verifySignature(req, body);
  if (!isValid) {
    await log.warn('Webhook signature verification failed', { requestId });
    return new Response('Unauthorized', { status: 401 });
  }

  const event = req.headers.get('x-github-event');
  const payload = JSON.parse(body);

  if (event === 'pull_request' && payload.action === 'opened') {
    const pr = payload.pull_request;
    const isRenovate = pr.user?.login === 'renovate[bot]';

    if (isRenovate) {
      const branch = pr.head.ref;
      const title = pr.title;
      const createdAt = pr.created_at;

      const packageGroup = branch.replace('renovate/', '');
      const severity = title.includes('major') ? 'warning' : 'info';

      //   log.info('dependency.update', {
      //     source: 'renovate',
      //     packageGroup,
      //     branch,
      //     title,
      //     createdAt,
      //     severity,
      //   });
    }
  }

  return new Response('OK', { status: 200 });
}
