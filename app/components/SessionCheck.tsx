'use client';

import { useEffect, useState } from 'react';
import { SessionExpiredModal } from './SessionExpiredModal';
import { logger } from '../lib/logger';

const requestId = crypto.randomUUID();
export function SessionCheck() {
  const [sessionExpired, setSessionExpired] = useState(false);
  let answer: string = 'A';
  console.log('[SessionCheck] Session check response status: 1', answer);
  useEffect(() => {
    fetch('/api/me').then((res) => {
      if (res.status === 401) {
        setSessionExpired(true);
      }
      let answer: string = res.status.toString();
      console.log('[SessionCheck] Session check response status: 2', answer);
      try {
        void logger({
          severity: 'info',
          source: 'Session Check.ts',
          message: `Session check performed`,
          requestId,
          metadata: { userAction: 'session_check', answer: 'answer ' + answer },
        });
      } catch {
        console.log('[SessionCheck] Failed to log session check event');
      }
    });
  }, []);

  return <SessionExpiredModal visible={sessionExpired} />;
}
