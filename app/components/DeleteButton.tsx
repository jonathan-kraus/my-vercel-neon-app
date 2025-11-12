'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createLogger } from '../utils/logger';
import { generateUUID } from '@/uuidj';

export function DeleteButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const requestId = generateUUID();
    const log = createLogger('app/components/DeleteButton.tsx', requestId);
    try {
      await log.info(`Post delete attempted: ${postId}`, { userAction: 'delete_attempt', postId });

      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Delete failed');
      }
      await log.info(`Post delete succeeded: ${postId}`, { userAction: 'delete_success', postId });
      toast.success('Post deleted');
      router.refresh();
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete post');
      const errorMessage = err instanceof Error ? err.message : String(err);
      await log.error(`Post delete failed: ${postId}`, { error: errorMessage, postId });
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
