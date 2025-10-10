import "server-only";
import { StackServerApp } from "@stackframe/stack";

const projectId: string = process.env.NEXT_PUBLIC_STACK_PROJECT_ID!;
const publishableClientKey: string = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!;

export const stackServerApp = new StackServerApp({
  projectId,
  publishableClientKey,
  tokenStore: "nextjs-cookie",
});
// this is not used
