'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deletePost } from '@/app/actions/deletePost';
import { logEvent } from '@/app/lib/log';
import { toast } from 'react-hot-toast';

export function DeleteButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const requestId = crypto.randomUUID();

  const handleDelete = async () => {
    await logEvent({
      source: 'DeleteButton',
      message: `User requested delete for post ${postId}`,
      requestId,
      metadata: { postId },
    });

    try {
      const formData = new FormData();
      formData.append('id', String(postId));
      await deletePost(formData);

      await logEvent({
        source: 'DeleteButton',
        message: `Post ${postId} successfully deleted`,
        requestId,
        metadata: { postId },
      });

      toast.success('Post deleted');
      startTransition(() => router.refresh());
    } catch (err) {
      await logEvent({
        source: 'DeleteButton',
        message: `Delete failed for post ${postId}`,
        requestId,
        metadata: { postId, error: String(err) },
      });

      toast.error('Failed to delete post');
    }
  };

  return (
    <button onClick={handleDelete} disabled={isPending} className="text-sky-600 ml-4">
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
