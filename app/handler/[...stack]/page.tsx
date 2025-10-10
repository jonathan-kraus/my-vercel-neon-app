'use client';

import { stackServerApp } from '@/app/lib/stackServerApp';
import { StackHandler } from '@stackframe/stack';

export default function StackRoutePage(props: unknown) {
  return (
    <StackHandler
      app={stackServerApp} // ✅ this resolves the type error
      fullPage
      routeProps={props}
    />
  );
}
