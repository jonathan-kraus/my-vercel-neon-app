'use client';

import { createContext, useContext, ReactNode } from 'react';
import { generateUUID } from '@/uuidj';

// Create the context
const RequestIdContext = createContext<string>('');

// Custom hook to use the requestId
export function useRequestId(): string {
  const requestId = useContext(RequestIdContext);
  if (!requestId) {
    console.warn('⚠️ useRequestId called outside RequestIdProvider - generating new ID');
    return generateUUID();
  }
  return requestId;
}

// Provider component
export function RequestIdProvider({ children }: { children: ReactNode }) {
  // Generate ONE requestId for the entire component tree
  const requestId = generateUUID();

  console.log(`🆔 RequestIdProvider created with ID: ${requestId}`);

  return <RequestIdContext.Provider value={requestId}>{children}</RequestIdContext.Provider>;
}
