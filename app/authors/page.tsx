export const dynamic = 'force-dynamic';
import { db } from '../lib/db';
import PostCountBadge from '../components/PostCountBadge';

const requestId = crypto.randomUUID();
type Author = {
  id: number;
  name: string | null;
  _count?: { posts: number };
};
const currentFile = __filename;
let result = currentFile.split('.next/server/app')[1];
result = result.substring(0, result.lastIndexOf('/'));
console.log('[app/authors] result', result);

export default async function AuthorsPage() {
  const severity = 'info';
  const source = 'AuthorsPage';
  const message = `Authors page accessed`;
  const metadata = { action: 'fetch', timestamp: new Date().toISOString() };
  try {
    console.log('🚀 [AuthorsPage] Starting logic');
  } catch (err) {
    console.error(`❌ ${requestId} [AuthorsPage] Error caught:`, err);
  }
  const authors: Author[] = await db.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, _count: { select: { posts: true } } },
  });
  if (authors.length === 0) {
    console.log(`[ AuthorsPage] No authors found.`);
  } else {
    if (result.includes('auth')) {
      await db.log.create({
        data: {
          severity,
          source,
          message,
          requestId,
          metadata: metadata ?? {},
          timestamp: new Date(),
        },
      });
      console.log(`[AuthorsPage] Fetched ${authors.length} authors.`);
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
}
