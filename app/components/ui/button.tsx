import { cn } from '@/app/lib/authUtils';

export function Button({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'icon';
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded transition-colors';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100',
    ghost: 'text-gray-600 hover:bg-gray-100',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  };
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    icon: 'p-2 w-9 h-9',
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
