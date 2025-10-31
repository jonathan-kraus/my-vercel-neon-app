'use client';

import React from 'react';
import toast from 'react-hot-toast';

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  const s = size;
  return (
    <svg
      className={`animate-spin h-${s} w-${s} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export type CustomToastOptions = {
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  duration?: number;
};

export function showCustomToast(content: React.ReactNode, opts?: CustomToastOptions) {
  toast.custom(
    (t) => (
      <div
        className={`bg-blue-950 text-yellow-300 p-4 rounded shadow max-w-md whitespace-pre-line ${
          t.visible ? 'animate-enter' : 'animate-leave'
        }`}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">{content}</div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-yellow-300 hover:text-yellow-500 text-xl font-bold"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    ),
    { duration: opts?.duration, position: opts?.position }
  );
}

export function showCookieSummaryToast(summary: string) {
  const content = (
    <div>
      <strong className="block mb-2">Cookie summary</strong>
      <pre className="text-sm">{summary}</pre>
    </div>
  );
  showCustomToast(content, { position: 'top-right', duration: 8000 });
}
