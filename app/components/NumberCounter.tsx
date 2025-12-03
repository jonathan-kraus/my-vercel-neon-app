'use client';
import { useEffect, useRef, useState } from 'react';

export default function NumberCounter({
  value,
  duration = 1600,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<number | null>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = value;

    const step = (ts: number) => {
      const t = Math.min(1, (ts - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const cur = Math.round(from + (to - from) * eased);
      setDisplay(cur);
      if (t < 1) ref.current = requestAnimationFrame(step);
    };

    ref.current = requestAnimationFrame(step);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
    // Intentionally using only `value` and `duration` as deps to animate on change
  }, [value, duration]);

  return <span className={className ?? 'text-blue-600 mt-2'}>{display}</span>;
}
