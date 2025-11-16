// utils/github.ts
export async function getCommitMessage(payload: any): Promise<string | undefined> {
  // Resolve SHA from different event types
  const sha =
    payload.after || // push events
    payload.pull_request?.head?.sha || // PR events
    payload.workflow_run?.head_sha || // workflow_run events
    payload.check_suite?.head_sha || // check_suite events
    payload.check_run?.head_sha || // check_run events
    payload.sha; // status/deployment events

  // Try to get commit message directly from payload
  let description =
    payload.head_commit?.message || // push events
    payload.pull_request?.title || // PR title
    payload.deployment?.description; // deployment description

  // Fallback: fetch commit message from GitHub API
  if (!description && sha) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/jonathan-kraus/my-vercel-neon-app/commits/${sha}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        description = data?.commit?.message;
      } else {
        console.error('GitHub API error:', res.status, await res.text());
      }
    } catch (err) {
      console.error('Commit fetch failed:', err);
    }
  }

  return description;
}
