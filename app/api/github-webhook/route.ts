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

  if (event === 'check_run') {
    const run = payload.check_run;
    await log.info('check.run', {
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      headSha: run.head_sha?.substring(0, 7),
      externalId: run.external_id,
      app: run.app?.name,
      requestId,
    });
  }

  if (event === 'check_suite') {
    const suite = payload.check_suite;
    await log.info('check.suite', {
      id: suite.id,
      status: suite.status,
      conclusion: suite.conclusion,
      headBranch: suite.head_branch,
      headSha: suite.head_sha?.substring(0, 7),
      app: suite.app?.name,
      requestId,
    });
  }

  if (event === 'deployment_status') {
    const deployment = payload.deployment;
    const deploymentStatus = payload.deployment_status;

    await log.info('deployment.status', {
      state: deploymentStatus.state,
      environment: deployment.environment,
      sha: deployment.sha?.substring(0, 7),
      commitMessage:
        deployment.payload?.commit_message ||
        deployment.description ||
        payload.commits?.[0]?.message,
      cm: deployment.payload?.commit.message,
      deploymentUrl: deploymentStatus.target_url,
      creator: deployment.creator?.login,
      pusher: deployment.payload?.pusher?.name || payload.sender?.login,
      requestId,
    });
  }
  console.log('event', event);
  console.log('payload', payload);

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

  if (event === 'push') {
    const commits = payload.commits || [];
    for (const commit of commits) {
      await log.info('commit.pushed', {
        sha: commit.id.substring(0, 7),
        message: commit.message,
        author: commit.author?.name,
        email: commit.author?.email,
        branch: payload.ref?.replace('refs/heads/', ''),
        pusher: payload.pusher?.name,
        requestId,
      });
    }
  }

  if (event === 'workflow_run') {
    const workflow = payload.workflow_run;
    await log.info('workflow.run', {
      workflowName: workflow.name,
      status: workflow.status,
      conclusion: workflow.conclusion,
      event: workflow.event,
      branch: workflow.head_branch,
      sha: workflow.head_sha?.substring(0, 7),
      actor: workflow.actor?.login,
      runUrl: workflow.html_url,
      requestId,
    });
  }

  if (event === 'deployment') {
    const deployment = payload.deployment;
    await log.info('deployment.created', {
      environment: deployment.environment,
      sha: deployment.sha?.substring(0, 7),
      ref: deployment.ref,
      task: deployment.task,
      creator: deployment.creator?.login,
      description: deployment.description,
      requestId,
    });
  }

  if (event === 'status') {
    await log.info('commit.status', {
      state: payload.state,
      context: payload.context,
      description: payload.description,
      sha: payload.sha?.substring(0, 7),
      targetUrl: payload.target_url,
      branches: payload.branches?.map((b: any) => b.name).join(', '),
      requestId,
    });
  }

  // Log any other events we haven't specifically handled
  if (
    event &&
    !['deployment_status', 'pull_request', 'workflow_run', 'deployment', 'status'].includes(event)
  ) {
    await log.info('webhook.unhandled', {
      event,
      action: payload.action,
      keys: Object.keys(payload),
      requestId,
    });
  }

  return new Response('OK', { status: 200 });
}
