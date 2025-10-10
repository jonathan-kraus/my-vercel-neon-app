import { StackProvider } from '@stackframe/react';
import { stackServerApp } from '@/app/lib/stackServerApp';

export default function StackProviderWrapper({ children }: { children: React.ReactNode }) {
  return <StackProvider app={stackServerApp}>{children}</StackProvider>;
}
