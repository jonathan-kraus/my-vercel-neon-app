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

      toast.success('Follow-up marked as complete!');
      router.refresh();
    } catch (err) {
      console.error('Complete failed', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete follow-up';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded font-semibold"
      title="Mark follow-up as complete"
    >
      {loading ? 'Completing…' : 'Complete'}
    </button>
  );
}
