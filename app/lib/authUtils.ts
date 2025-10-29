export function getAuthorizedUser(): string | null {
  const match = document.cookie.match(/authorizedUser=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

import { clsx } from 'clsx';

export function cn(...inputs: Parameters<typeof clsx>) {
  return clsx(...inputs);
}
