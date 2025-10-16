'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { logEvent } from '../lib/log';

export function DeleteButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const requestId = crypto.randomUUID();

    try {
      await logEvent({
        source: 'DeleteButton',
        message: `Post delete attempted: ${postId}`,
        requestId,
        metadata: { userAction: 'delete_attempt', postId },
      });

      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Delete failed');
      }

      toast.success('Post deleted');
      router.refresh();
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete post');

      await logEvent({
        source: 'DeleteButton',
        message: `Post delete failed: ${postId}`,
        requestId,
        severity: 'error',
        metadata: { error: err.message, postId },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-600 hover:underline px-2 py-1"
      title="Delete post"
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  );
}
