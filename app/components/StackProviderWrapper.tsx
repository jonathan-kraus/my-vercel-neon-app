import { StackProvider } from '@stackframe/react';
import { stackClientApp } from '../lib/stackClientApp';

export default function StackProviderWrapper({ children }: { children: React.ReactNode }) {
  return <StackProvider app={stackClientApp}>{children}</StackProvider>;
}
