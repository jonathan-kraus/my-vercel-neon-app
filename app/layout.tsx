import type { Metadata } from "next";
import "./globals.css";
import { inter } from "./fonts";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Vercel + Neon",
  description: "Use Neon with Vercel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
