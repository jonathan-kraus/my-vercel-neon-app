'use client';

import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function ClientShell() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <Toaster position="top-right" />
    </>
  );
}
