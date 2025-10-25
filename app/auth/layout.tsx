// app/auth/layout.tsx
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  // Do NOT render <html> or <body> here — root layout already provides them.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">🔐 Restricted Access</h1>
        {children}
      </div>
    </div>
  );
}
