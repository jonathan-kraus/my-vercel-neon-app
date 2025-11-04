'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { completePost } from '../actions/completePost';

export function CompleteButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('postId', postId.toString());

      await completePost(formData);

      toast.success('Post marked as completed!');
      router.refresh();
    } catch (err) {
      console.error('Complete failed', err);
      toast.error('Failed to complete post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="text-sm text-green-600 hover:underline px-2 py-1"
      title="Mark post as completed"
    >
      {loading ? 'Completing…' : 'Complete'}
    </button>
  );
}
