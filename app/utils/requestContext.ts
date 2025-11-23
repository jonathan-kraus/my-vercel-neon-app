import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId?: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.requestId;
}
