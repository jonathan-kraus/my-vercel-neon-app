import { NextRequest } from 'next/server';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';
import { getCommitMessage } from '@/app/utils/github';
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
  const description = await getCommitMessage(payload);
  async function fetchCommitMessage(sha: string) {
    const res = await fetch(
      `https://api.github.com/repos/jonathan-kraus/my-vercel-neon-app/commits/${sha}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    if (!res.ok) {
      console.error('GitHub API error:', res.status, await res.text());
      return undefined;
    }

    const data = await res.json();
    console.log('Commit data:', data);
    return data?.commit?.message;
  }

  const sha =
    payload.after || // push events
    payload.pull_request?.head?.sha || // PR events
    payload.workflow_run?.head_sha || // workflow_run events
    payload.check_suite?.head_sha || // check_suite events
    payload.check_run?.head_sha || // check_run events
    payload.sha; // <-- status/deployment events often put it here

  let description2 = 'D2';
  console.log('sha candidate:', sha);
  console.log('description before fetch:', description);
  if (!description && sha) {
    description2 = await fetchCommitMessage(sha);
  }
  console.log('description2 after fetch:', description2);
  await log.info('JKworkflow.run', {
    sha: sha?.substring(0, 7),
    description,
    event,
    action: payload.action,
    // ...other fields
  });
  // Log all webhook events received
  await log.info('webhook.received', {
    event: req.headers.get('x-github-event'),
    action: payload.action,
    requestId,

    // Normalized fields for dashboard consistency
    sha: payload.after || payload.pull_request?.head?.sha || payload.workflow_run?.head_sha,
    branch:
      payload.ref?.replace('refs/heads/', '') ||
      payload.pull_request?.head?.ref ||
      payload.workflow_run?.head_branch,
    actor: payload.sender?.login || payload.workflow_run?.actor?.login,
    description:
      payload.head_commit?.message ||
      payload.pull_request?.title ||
      payload.deployment?.description,
    status:
      payload.status ||
      payload.workflow_run?.status ||
      payload.check_suite?.status ||
      payload.check_run?.status,
    conclusion:
      payload.conclusion ||
      payload.workflow_run?.conclusion ||
      payload.check_suite?.conclusion ||
      payload.check_run?.conclusion,
    workflowName: payload.workflow_run?.name,
    runUrl:
      payload.workflow_run?.html_url ||
      payload.check_run?.html_url ||
      payload.deployment_status?.target_url,

    // Optional: include raw payload for debugging
    raw: payload,
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
