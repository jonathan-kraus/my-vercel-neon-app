type Props = {
  count: number;
  className?: string;
};

export default function PostCountBadge({ count, className = '' }: Props) {
  const isZero = count === 0;
  // Non-zero: solid green bg with white text for better contrast. Zero: muted gray.
  const bg = isZero
    ? 'bg-gray-200 border-gray-300 text-gray-700'
    : 'bg-[#00E599] border-[#00E599]/80 text-white';
  const title = `${count} post${count === 1 ? '' : 's'}`;

  return (
    <span
      title={title}
      aria-label={title}
      className={`ml-2 inline-flex items-center rounded-full ${bg} border px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      {count}
    </span>
  );
}
