import { NextRequest } from 'next/server';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';
import { getCommitMessage, getSha } from '@/app/utils/github';
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

  const payload = JSON.parse(body);
  const je = req.headers.get('x-github-event');
  const sha = getSha(payload);
  const commitMessage = getCommitMessage(payload);
  log.info('Verifying webhook signature', {
    sha,
    commitMessage,
  });
  switch (je) {
    case 'check_run':
      {
        const run = payload.check_run;
        await log.info('✅ check.run 🏃', {
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
      break;
    case 'check_suite':
      {
        const suite = payload.check_suite;
        await log.info(`✅ ${je} ✅`, {
          id: suite.id,
          status: suite.status,
          conclusion: suite.conclusion,
          headBranch: suite.head_branch,
          headSha: suite.head_sha?.substring(0, 7),
          app: suite.app?.name,
          requestId,
        });
      }
      break;
    case 'deployment':
      {
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
      break;
    case 'deployment_status':
      {
        const deploymentStatus = payload.deployment_status;
        const deployment = payload.deployment;
        await log.info('deployment.status', {
          state: deploymentStatus.state,
          environment: deployment.environment,
          sha: deployment.sha?.substring(0, 7),
          commitMessage:
            deployment.payload?.commit_message ||
            deployment.description ||
            payload.commits?.[0]?.message,
          deploymentUrl: deploymentStatus.target_url,
          creator: deployment.creator?.login,
          pusher: deployment.payload?.pusher?.name || payload.sender?.login,
          requestId,
        });
      }
      break;
    case 'issue_comment':
      {
        const comment = payload.comment;
        const issue = payload.issue;
        await log.info('issue.comment', {
          event: je,
          commenter: comment.user?.login,
          comment_body: comment.body,
          comment_ID: comment.id,
          issue_ID: issue.id,
          issue_url: issue.url,
          state: issue.state,
          title: issue.title,
          requestId,
        });
      }
      break;
    case 'issues':
      {
        const issue = payload.issue;
        await log.info('issues', {
          event: je,
          action: payload.action,
          issue_ID: issue.id,
          issue_url: issue.url,
          state: issue.state,
          title: issue.title,
          requestId,
          // action: payload.action,
          // issue: issue.number,
          // title: issue.title,
          // state: issue.state,
        });
      }
      break;
    case 'pull_request':
      {
        const pr = payload.pull_request;
        const isRenovate = pr.user?.login === 'renovate[bot]';

        if (isRenovate) {
          const branch = pr.head.ref;
          const title = pr.title;
          const packageGroup = branch.replace('renovate/', '');
          const severity = title.includes('major') ? 'warning' : 'info';

          if (payload.action === 'opened') {
            await log.info('dependency.update.opened', {
              source: 'renovate',
              packageGroup,
              branch,
              title,
              createdAt: pr.created_at,
              severity,
              prUrl: pr.html_url,
              requestId,
            });
          } else if (payload.action === 'closed' && pr.merged) {
            await log.info('dependency.update.merged', {
              source: 'renovate',
              packageGroup,
              branch,
              title,
              severity,
              prUrl: pr.html_url,
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
              prUrl: pr.html_url,
              requestId,
            });
          }
        }
      }
      break;
    case 'push':
      {
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
      break;
    case 'repository':
      {
        const repository = payload.repository;
        await log.info('repository.event', {
          id: repository.id,
          name: repository.name,
          fullName: repository.full_name,
          description: repository.description,
          ownerLogin: repository.owner?.login,
          requestId,
        });
      }
      break;
    case 'status':
      await log.info('commit.status', {
        state: payload.state,
        context: payload.context,
        description: payload.description,
        sha: payload.sha?.substring(0, 7),
        targetUrl: payload.target_url,
        branches: payload.branches?.map((b: any) => b.name).join(', '),
        requestId,
      });
      break;
    case 'workflow_job':
      {
        const job = payload.workflow_job;
        await log.info('workflow.job', {
          jobName: job.name,
          action: payload.action,
          status: job.status,
          conclusion: job.conclusion,
          startedAt: job.started_at,
          completedAt: job.completed_at,
          runId: job.run_id,
          runUrl: job.html_url,
          runnerName: job.runner_name,
          labels: job.labels?.join(', '),
          requestId,
        });
      }
      break;
    case 'workflow_run':
      {
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
      break;
    default:
      await log.info('webhook.unhandled', {
        event: je,
        action: payload.action,
        keys: Object.keys(payload),
        requestId,
      });
  }

  return new Response('OK', { status: 200 });
}
