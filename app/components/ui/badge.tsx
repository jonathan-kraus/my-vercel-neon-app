export function Badge({
  children,
  variant = 'secondary',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'destructive' | 'default' | 'secondary' | 'outline';
  className?: string;
}) {
  const variants = {
    destructive: 'bg-red-100 text-red-800',
    default: 'bg-gray-200 text-gray-800',
    secondary: 'bg-blue-100 text-blue-800',
    outline: 'border border-gray-300 text-gray-600',
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
