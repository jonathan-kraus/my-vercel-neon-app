type Props = {
  count: number;
  className?: string;
};

export default function PostCountBadge({ count, className = '' }: Props) {
  const isZero = count === 0;
  const bg = isZero ? 'bg-gray-200 border-gray-300 text-gray-700' : 'bg-[#00E599]/10 border-[#00E599]/20 text-[#1a8c66]';
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
