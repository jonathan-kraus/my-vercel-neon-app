import React from 'react';

interface SparklineProps {
  /** The array of numbers to plot (e.g., latency history) */
  data: number[];
  /** Width of the SVG container (default: 100) */
  width?: number;
  /** Height of the SVG container (default: 30) */
  height?: number;
  /** Color for the line and last point (default: indigo-600) */
  strokeColor?: string;
  /** Color for the area below the line (default: none) */
  fillColor?: string;
  /** Width of the line stroke (default: 2) */
  strokeWidth?: number;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  strokeColor = '#4f46e5', // indigo-600
  strokeWidth = 2,
  fillColor = 'none',
}) => {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height}>
        <text x={width / 2} y={height / 2} fontSize="10" textAnchor="middle" fill="#9ca3af">
          No Data
        </text>
      </svg>
    );
  }

  // 1. Normalize data for SVG coordinates
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  // Ensure range is at least 1 to prevent division by zero
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  // 2. Map data points to SVG coordinates (x, y)
  const points = data
    .map((value, index) => {
      // Scale x: Distribute points evenly across the width
      const x = (index / (data.length - 1)) * width;
      // Scale y: Invert value (min value is at the bottom, max value is at the top)
      const y = height - ((value - minVal) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  // 3. Define the area path for optional fill
  const areaPath = `M ${points} L ${width},${height} L 0,${height} Z`;
  const lastX = ((data.length - 1) / (data.length - 1)) * width;
  const lastY = height - ((data[data.length - 1] - minVal) / range) * height;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* Optional: Fill the area below the line */}
      {fillColor !== 'none' && <path d={areaPath} fill={fillColor} stroke="none" />}
      {/* The main sparkline plot */}
      <polyline fill="none" stroke={strokeColor} strokeWidth={strokeWidth} points={points} />
      {/* Highlight the latest data point */}
      <circle cx={lastX} cy={lastY} r={2} fill={strokeColor} />
    </svg>
  );
};

export default Sparkline;
