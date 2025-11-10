'use client';

import { useTransition } from 'react';
import { toast } from 'react-hot-toast';
import { logInfoFactory } from '../utils/logger';

export function MarkCompleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();
  const logInfo = logInfoFactory('app/components/MarkCompleteButton.tsx');

  const handleClick = () => {
    startTransition(async () => {
      const requestId =
        (typeof crypto !== 'undefined' && (crypto as any).randomUUID?.()) ||
        `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

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
          toast.success(`Post unpublished! (${data.requestId || requestId})`);
          try {
            await logInfo(`Post unpublished`, { postId }, requestId);
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
              } catch {
                reason = text;
              }
            }
          } catch (readErr) {
            console.error('Failed to read error response body', readErr);
          }

          toast.error(`Failed to unpublish: ${reason} (${serverRequestId})`);
          try {
            await logInfo(`Unpublish failed`, { postId, status: res.status, reason }, requestId);
          } catch {
            // non-fatal
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Unpublish exception', err);
        toast.error(`Failed to unpublish: ${msg}`);
        try {
          await logInfo(`Unpublish exception`, { postId, error: msg }, requestId);
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
