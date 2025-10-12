// app/auth/layout.tsx
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body className="bg-gray-100 text-gray-900 min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">🔐 Restricted Access</h1>
          {children}
        </div>
      </body>
    </html>
  );
}
