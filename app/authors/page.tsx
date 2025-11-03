export const dynamic = 'force-dynamic';
import { db } from '../lib/db';
import PostCountBadge from '../components/PostCountBadge';
import { logInfoFactory } from '@/app/utils/logger';
import toast from 'react-hot-toast';
const logInfo = logInfoFactory('app/authors/page.tsx');
const requestId = crypto.randomUUID();
type Author = {
  id: number;
  name: string | null;
  _count?: { posts: number };
};

export default async function AuthorsPage() {
  toast.success('Authors Connected!');
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
    console.log(`[ AuthorsPage ] No authors found.`);
  } else {
    // Log access to authors page
    logInfo('[AuthorsPage] Fetched authors', authors, requestId);
  }
  console.log(`[AuthorsPage] Fetched ${authors.length} authors.`);
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
