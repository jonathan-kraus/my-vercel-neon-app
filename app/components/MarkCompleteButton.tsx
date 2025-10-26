'use client';

import { useTransition } from 'react';
import { toast } from 'react-hot-toast';

export function MarkCompleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const res = await fetch(`/api/posts/${postId}/unpublish`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Post marked as unpublished');
      } else {
        toast.error('Failed to mark unpublished');
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-sm text-blue-600 hover:underline px-2 py-1"
      title="Mark post as complete"
    >
      {isPending ? 'Marking…' : 'Mark Complete'}
    </button>
  );
}
