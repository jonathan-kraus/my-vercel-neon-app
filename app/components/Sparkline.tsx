'use client';
import React from 'react';

export default function Sparkline({
  value,
  max = 100,
  color = 'blue',
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const pts = new Array(8).fill(0).map((_, i) => {
    const norm = Math.max(
      0,
      Math.min(1, (value / Math.max(1, max)) * (0.6 + 0.4 * Math.sin(i + value)))
    );
    const x = (i / 7) * 100;
    const y = 100 - norm * 100;
    return `${x},${y}`;
  });
  const d = 'M ' + pts.join(' L ');
  const stroke =
    color === 'blue'
      ? '#1e3a8a'
      : color === 'purple'
        ? '#6b21a8'
        : color === 'green'
          ? '#065f46'
          : '#1e3a8a';
  return (
    <svg width="80" height="24" viewBox="0 0 100 100" preserveAspectRatio="none" className="ml-2">
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={3}
        strokeOpacity={0.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
