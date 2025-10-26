'use client';

import { useEffect, useState } from 'react';
import { SessionExpiredModal } from './SessionExpiredModal';

export function SessionCheck() {
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    fetch('/api/me').then((res) => {
      if (res.status === 401) {
        setSessionExpired(true);
      }
    });
  }, []);

  return <SessionExpiredModal visible={sessionExpired} />;
}
