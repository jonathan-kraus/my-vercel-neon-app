'use client';

import { useTransition } from 'react';
import { toast } from 'react-hot-toast';
import { createLogger } from '../utils/logger';
import { generateUUID } from '@/uuidj';

export function MarkCompleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const requestId = generateUUID();
    const log = createLogger('app/components/MarkCompleteButton.tsx', requestId);

    startTransition(async () => {
      try {
        const res = await fetch('/api/entry/unpublish', {
          method: 'POST',
          body: JSON.stringify({ id: postId }),
          headers: {
            'Content-Type': 'application/json',
            'x-request-id': requestId,
          },
        });

        if (res.ok) {
          const data = await res.json();
          // Move toast outside transition by using queueMicrotask
          queueMicrotask(() => toast.success(`Post unpublished! (${data.requestId || requestId})`));
          try {
            await log.info(`Post unpublished`, { postId });
          } catch {
            // non-fatal
          }
        } else {
          // Try to extract a helpful message from the response body
          let reason = `HTTP ${res.status}`;
          let serverRequestId = requestId;
          try {
            const text = await res.text();
            if (text) {
              try {
                const parsed = JSON.parse(text);
                reason = parsed?.error || parsed?.message || text;
                serverRequestId = parsed?.requestId || requestId;
                log.error(`Unpublish failed`, { postId, status: res.status, reason });
              } catch {
                reason = text;
              }
            }
          } catch (readErr) {
            console.error('Failed to read error response body', readErr);
          }

          // Move toast outside transition
          queueMicrotask(() => toast.error(`Failed to unpublish: ${reason} (${serverRequestId})`));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Unpublish exception', err);
        // Move toast outside transition
        queueMicrotask(() => toast.error(`Failed to unpublish: ${msg}`));
        try {
          await log.info(`Unpublish exception`, { postId, error: msg });
        } catch {
          // non-fatal
        }
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
