import { StackServerApp } from "@stackframe/js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stackServerApp = new StackServerApp({
  // You should store these in environment variables based on your project setup
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "clg3j0z1e0000qzrmn8v6n4r9",
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ||  "pck_xsdqghke9ahtmp4jnnjgfed8z86ek8vf602cewjtmgcdr",
    secretServerKey: process.env.STACK_SECRET_SERVER_KEY || "sck_vef1z4x4e8g0p3y6w2h5r9t1u7q8m0n2b4c6d8e0f2g3h5j7k9l1m3n5p7r9t1v3",
    tokenStore: "memory",
});