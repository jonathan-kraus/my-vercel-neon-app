// utils/logHelpers.ts
import { logger } from './loggerCore';

export const logInfoFactory = (source: string) => {
  return (message: string, metadata?: Record<string, any>, requestId?: string) =>
    logger({ severity: 'info', source, message, requestId, metadata });
};

export const logErrorFactory = (source: string) => {
  return (message: string, metadata?: Record<string, any>, requestId?: string) =>
    logger({ severity: 'error', source, message, requestId, metadata });
};
