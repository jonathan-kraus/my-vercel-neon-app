import type { Metadata } from "next";
import "./globals.css";
// import { inter } from "./fonts";
import { Analytics } from '@vercel/analytics/next';

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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
