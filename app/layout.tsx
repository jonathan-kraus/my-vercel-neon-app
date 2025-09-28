import type { Metadata } from "next";
import "./globals.css";
// import { inter } from "./fonts";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import SideNav from './components/SideNav';
import { Toaster } from 'react-hot-toast';

<Toaster position="top-right" />

export const metadata: Metadata = {
  title: "Vercel + Neon + J",
  description: "Use Neon with Vercel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en" className="dark">
      <body>
        <div className="flex">
          <SideNav />
          <main className="flex-1">{children}</main>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
