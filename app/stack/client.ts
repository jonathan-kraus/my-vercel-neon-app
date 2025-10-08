import { StackClientApp } from "@stackframe/react";
import { useNavigate } from "react-router-dom";

export const stackClientApp = new StackClientApp({
  // You should store these in environment variables
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "clg3j0z1e0000qzrmn8v6n4r9",
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ||  "pck_xsdqghke9ahtmp4jnnjgfed8z86ek8vf602cewjtmgcdr",
  tokenStore: "cookie",
  redirectMethod: {
    useNavigate,
  }
});