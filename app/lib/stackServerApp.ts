import { StackServerApp } from '@stackframe/stack';

export const stackServerApp = new StackServerApp({
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!
  secretKey: process.env.STACK_SECRET_SERVER_KEY!,
  tokenStore: 'nextjs-cookie',
});
