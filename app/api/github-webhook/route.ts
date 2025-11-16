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

  // Log all webhook events received
  await log.info('webhook.received', {
    event,
    action: payload.action,
    requestId,
  });

  if (event === 'pull_request') {
    const pr = payload.pull_request;
    const isRenovate = pr.user?.login === 'renovate[bot]';

    if (isRenovate) {
      const branch = pr.head.ref;
      const title = pr.title;
      const createdAt = pr.created_at;
      const prUrl = pr.html_url;
      const merged = pr.merged;

      const packageGroup = branch.replace('renovate/', '');
      const severity = title.includes('major') ? 'warning' : 'info';

      if (payload.action === 'opened') {
        await log.info('dependency.update.opened', {
          source: 'renovate',
          packageGroup,
          branch,
          title,
          createdAt,
          severity,
          prUrl,
          requestId,
        });
      } else if (payload.action === 'closed' && merged) {
        await log.info('dependency.update.merged', {
          source: 'renovate',
          packageGroup,
          branch,
          title,
          severity,
          prUrl,
          mergedAt: pr.merged_at,
          requestId,
        });
      } else if (payload.action === 'synchronize') {
        await log.info('dependency.update.synchronized', {
          source: 'renovate',
          packageGroup,
          branch,
          title,
          severity,
          prUrl,
          requestId,
        });
      }
    }
  }

  return new Response('OK', { status: 200 });
}
