'use client';

import { useTransition } from 'react';
import { toast } from 'react-hot-toast';

export function MarkCompleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const res = await fetch(`/api/posts/${postId}/complete`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Post marked as complete');
      } else {
        toast.error('Failed to mark complete');
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-blue-400 hover:text-blue-600"
    >
      Mark Complete
    </button>
  );
}
