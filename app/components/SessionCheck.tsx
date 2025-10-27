'use client';

import { useEffect, useState } from 'react';
import { SessionExpiredModal } from './SessionExpiredModal';
import { logger } from '../lib/logger';

const requestId = crypto.randomUUID();
export function SessionCheck() {
  const [sessionExpired, setSessionExpired] = useState(false);
  let answer: string = 'A';

  useEffect(() => {
    fetch('/api/me').then((res) => {
      if (res.status === 401) {
        setSessionExpired(true);
      }
      let answer: string = res.status.toString();
      try {
        void logger({
          severity: 'info',
          source: 'SessionCheck.ts',
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
