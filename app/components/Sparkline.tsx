import React from 'react';

interface SparklineProps {
  /** The current value to display (e.g., utilization) */
  value: number;
  /** The maximum possible value (e.g., 100) */
  max: number;
  /** Color for the bar (default: blue) */
  color?: string;
  /** Height of the component (default: 8) */
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({
  value,
  max,
  color = '#2563eb', // blue-600
  height = 8,
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  // Ensure the percentage is between 0 and 100
  const normalizedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className="rounded-full bg-gray-200 overflow-hidden"
      style={{ height: `${height}px`, width: '100%' }}
      title={`${value} / ${max} (${normalizedPercentage.toFixed(1)}%)`}
    >
      <div
        className="h-full"
        style={{
          width: `${normalizedPercentage}%`,
          backgroundColor: color,
          transition: 'width 0.5s ease-out',
        }}
      />
    </div>
  );
};

export default Sparkline;
