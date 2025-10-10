'use client';

import StackProviderWrapper from './components/StackProviderWrapper';
import Providers from './providers';
import { StackTheme } from '@stackframe/stack';
import SideNav from './components/SideNav';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <StackProviderWrapper>
          <Providers>
            <StackTheme>
              <div className="flex">
                <SideNav />
                <main className="flex-1">{children}</main>
              </div>
              <Analytics />
              <SpeedInsights />
              <Toaster position="top-right" />
            </StackTheme>
          </Providers>
        </StackProviderWrapper>
      </body>
    </html>
  );
}
