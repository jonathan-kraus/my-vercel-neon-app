'use client';

import { StackProvider, StackClientApp, StackTheme } from '@stackframe/react';

const stackClientApp = new StackClientApp({
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  tokenStore: 'localStorage', // Required!
});
//const app = stackClientApp;
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={app}>
      <StackTheme>{children}</StackTheme>
    </StackProvider>
  );
}