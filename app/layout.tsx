'use client';
import Providers from './providers';
import { StackTheme } from "@stackframe/stack";
import { StackProvider } from '@stackframe/react';
import { stackServerApp } from '@/stack/server';
import "./globals.css";
// import { inter } from "./fonts";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import SideNav from './components/SideNav';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <StackProvider app={stackServerApp}>
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
        </StackProvider>
      </body>
    </html>
  );
}