'use client';
import Providers from './providers';
import { StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import "./globals.css";
// import { inter } from "./fonts";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import SideNav from './components/SideNav';
import { Toaster } from 'react-hot-toast';

<Toaster position="top-right" />



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en" className="dark">
      <body><Providers app={stackClientApp}><StackTheme>
        <div className="flex">
          <SideNav />
          <main className="flex-1">{children}</main>
        </div>
        <Analytics />
        <SpeedInsights />
      </StackTheme></Providers></body>
    </html>
  );
}
