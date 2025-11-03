export const dynamic = 'force-dynamic';
import { db } from '../lib/db';
import PostCountBadge from '../components/PostCountBadge';
import { logEvent } from '../lib/log';
type Author = {
  id: number;
  name: string | null;
  _count?: { posts: number };
};

export default async function AuthorsPage() {
  const requestId = crypto.randomUUID();
  let authors: Author[] = [];
  let hasError = false;
  let errorMessage = '';

  try {
    console.log('🚀 [AuthorsPage] Starting logic');

    authors = await db.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { posts: true } } },
    });

    if (authors.length === 0) {
      console.log(`[ AuthorsPage ] No authors found.`);
    } else {
      // Log successful fetch
      await logEvent({
        source: 'AuthorsPage',
        message: `Fetched ${authors.length} authors`,
        requestId,
        metadata: { userAction: 'fetch_authors', authorCount: authors.length },
      });
    }

    console.log(`[AuthorsPage] Fetched ${authors.length} authors.`);
  } catch (err) {
    hasError = true;
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`❌ ${requestId} [AuthorsPage] Error caught:`, err);

    // Log the error
    try {
      await logEvent({
        source: 'AuthorsPage',
        message: 'Failed to fetch authors',
        requestId,
        severity: 'error',
        metadata: {
          error: errorMessage,
          userAction: 'fetch_authors_failed',
        },
      });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }
  }

  if (hasError) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Authors</h1>
        <p className="text-red-600">Failed to load authors. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authors</h1>
      <ul className="space-y-3">
        {authors.map((a) => (
          <li key={a.id} className="flex items-center justify-between border p-3 rounded">
            <div>
              <div className="font-medium">{a.name ?? 'Unknown'}</div>
            </div>
            <PostCountBadge count={a._count?.posts ?? 0} />
          </li>
        ))}
      </ul>
    </div>
  );
}
