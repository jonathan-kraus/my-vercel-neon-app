'use client';

import { useTransition } from 'react';
import { toast } from 'react-hot-toast';

export function MarkCompleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const res = await fetch('/api/entry/unpublish', {
        method: 'POST',
        body: JSON.stringify({ id: postId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        toast.success('Post unpublished!');
      } else {
        toast.error('Failed to unpublish post');
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-semibold"
      title="Unpublish this post"
    >
      {isPending ? 'Unpublishing…' : 'Unpublish'}
    </button>
  );
}
