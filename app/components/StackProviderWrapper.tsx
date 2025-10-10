import { StackProvider } from '@stackframe/react';
import { stackServerApp } from '../lib/stackServerApp';

export default function StackProviderWrapper({ children }: { children: React.ReactNode }) {
  return <StackProvider app={stackServerApp}>{children}</StackProvider>;
}
