export const dynamic = 'force-dynamic';
import { db } from '../lib/db';
import PostCountBadge from '../components/PostCountBadge';
import { logInfoFactory, logErrorFactory } from '@/app/utils/logger';
import { generateUUID } from '../../uuidj';
type Author = {
  id: number;
  name: string | null;
  _count?: { posts: number };
};

const logInfo = logInfoFactory('app/authors/page.tsx');
const logError = logErrorFactory('app/authors/page.tsx');
export default async function AuthorsPage() {
  const requestId = generateUUID();
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
      await logInfo(
        `Fetched ${authors.length} authors`,
        { authorsCount: authors.length },
        requestId
      );
    }

    console.log(`[AuthorsPage] Fetched ${authors.length} authors.`);
  } catch (err) {
    hasError = true;
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`❌ ${requestId} [AuthorsPage] Error caught:`, err);

    // Log the error
    try {
      await logError(
        'Failed to fetch authors',
        
        {  error: errorMessage,
          userAction: 'fetch_authors_failed',},
          requestId
      );
    } catch (logErr) {
      console.error('[authors/page.tsx] Failed to log error:', logErr);
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
