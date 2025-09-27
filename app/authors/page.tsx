export const dynamic = "force-dynamic";
import { PrismaClient } from '@prisma/client';
import PostCountBadge from '../components/PostCountBadge';
import { createLog } from '../utils/db';
import { sendConfirmationEmail } from '../utils/sendemail';



await createLog({authorId: 1101,title: 'Authors',content: 'Author log',});
sendConfirmationEmail('jonathanckraus@gmail.com', 'JKGM Authors');
type Author = {
  id: number;
  name: string | null;
  _count?: { posts: number };
};

export default async function AuthorsPage() {
  const prisma = new PrismaClient();
  const authors: Author[] = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, _count: { select: { posts: true } } },
  });

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
