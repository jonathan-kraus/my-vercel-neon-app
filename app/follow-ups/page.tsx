export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { db } from '../lib/db';
import { DeleteButton } from '@/app/components/DeleteButton';

type FollowUpPost = {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  followUpDate: Date | null;
  followUpNotes: string | null;
  author?: { id?: number; name?: string | null };
};

export default async function FollowUpsPage() {
  const followUpPosts = await db.post.findMany({
    where: { needsFollowUp: true },
    include: { author: true },
    orderBy: { followUpDate: 'asc' },
  });

  const now = new Date().getTime();

  const urgentFollowUps = followUpPosts.filter((post) => {
    if (!post.followUpDate) return false;
    const daysUntilDue = Math.ceil((post.followUpDate.getTime() - now) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3; // Due within 3 days
  });

  const upcomingFollowUps = followUpPosts.filter((post) => {
    if (!post.followUpDate) return false;
    const daysUntilDue = Math.ceil((post.followUpDate.getTime() - now) / (1000 * 60 * 60 * 24));
    return daysUntilDue > 3 && daysUntilDue <= 7; // Due within 4-7 days
  });

  const futureFollowUps = followUpPosts.filter((post) => {
    if (!post.followUpDate) return false;
    const daysUntilDue = Math.ceil((post.followUpDate.getTime() - now) / (1000 * 60 * 60 * 24));
    return daysUntilDue > 7; // Due in more than 7 days
  });

  const noDateFollowUps = followUpPosts.filter((post) => !post.followUpDate);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Follow-up Reminders</h1>
        <Link href="/" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
          ← Back to Home
        </Link>
      </div>

      {followUpPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No posts need follow-up! 🎉</p>
          <Link
            href="/"
            className="inline-block mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Create a Post
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Urgent Follow-ups */}
          {urgentFollowUps.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-red-600 flex items-center gap-2">
                🚨 Urgent (Due within 3 days)
              </h2>
              <div className="space-y-4">
                {urgentFollowUps.map((post) => (
                  <FollowUpCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Follow-ups */}
          {upcomingFollowUps.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-orange-600 flex items-center gap-2">
                ⏰ Upcoming (Due within 7 days)
              </h2>
              <div className="space-y-4">
                {upcomingFollowUps.map((post) => (
                  <FollowUpCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* Future Follow-ups */}
          {futureFollowUps.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 flex items-center gap-2">
                📅 Future Follow-ups
              </h2>
              <div className="space-y-4">
                {futureFollowUps.map((post) => (
                  <FollowUpCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* No Date Set */}
          {noDateFollowUps.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-600 flex items-center gap-2">
                📝 No Date Set
              </h2>
              <div className="space-y-4">
                {noDateFollowUps.map((post) => (
                  <FollowUpCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function FollowUpCard({ post }: { post: FollowUpPost }) {
  const now = new Date().getTime();
  const daysUntilDue = post.followUpDate
    ? Math.ceil((post.followUpDate.getTime() - now) / (1000 * 60 * 60 * 24))
    : null;

  const getUrgencyColor = () => {
    if (!daysUntilDue) return 'bg-gray-100 border-gray-300';
    if (daysUntilDue <= 3) return 'bg-red-50 border-red-300';
    if (daysUntilDue <= 7) return 'bg-orange-50 border-orange-300';
    return 'bg-blue-50 border-blue-300';
  };

  return (
    <div className={`border rounded-lg p-4 ${getUrgencyColor()}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
          <p className="text-gray-700 mb-3">{post.content}</p>

          <div className="text-sm text-gray-600 space-y-1">
            <p>By {post.author?.name || 'Unknown'}</p>
            <p>Created: {new Date(post.createdAt).toLocaleDateString()}</p>

            {post.followUpDate && (
              <p className="font-medium">
                Follow-up due: {post.followUpDate.toLocaleDateString()}
                {daysUntilDue !== null && (
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs ${
                      daysUntilDue <= 3
                        ? 'bg-red-200 text-red-800'
                        : daysUntilDue <= 7
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {daysUntilDue === 0
                      ? 'Due today'
                      : daysUntilDue === 1
                        ? 'Due tomorrow'
                        : daysUntilDue < 0
                          ? `${Math.abs(daysUntilDue)} days overdue`
                          : `${daysUntilDue} days left`}
                  </span>
                )}
              </p>
            )}

            {post.followUpNotes && <p className="italic">Notes: {post.followUpNotes}</p>}
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <DeleteButton postId={post.id} />
        </div>
      </div>
    </div>
  );
}
