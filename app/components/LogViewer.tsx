'use client';

import { useEffect, useState } from 'react';
import type { Log } from '@prisma/client';

import { getLogsByAuthor } from '../utils/getLogs'; // adjust path

export default function LogViewer() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getLogsByAuthor();
      setLogs(data);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  if (loading) return <p>Loading logs...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Log Entries (Author 1101)</h2>
      {logs.length === 0 ? (
        <p>No logs found.</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="border p-4 rounded shadow">
            <h3 className="font-semibold">{log.title}</h3>
            <p>{log.content}</p>
            <p className="text-sm text-gray-500">Created: {new Date(log.createdAt).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
}
