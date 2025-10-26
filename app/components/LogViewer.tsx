'use client';

import { useEffect, useState } from 'react';
import type { Log } from '@prisma/client';
import { getLogs } from '../utils/getLogs'; // adjust path

export default function LogViewer() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getLogs();
      setLogs(data);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  if (loading) return <p>Loading logs...</p>;

  return (
    <div className="max-w-full overflow-x-auto px-4">
      <h2 className="text-xl font-bold mb-4">Log Entries</h2>
      {logs.length === 0 ? (
        <p>No logs found.</p>
      ) : (
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-blue-900 text-yellow-200">
              <th className="w-1/5 px-2 py-2 text-left">Source</th>
              <th className="w-3/5 px-2 py-2 text-left">Message</th>
              <th className="w-1/5 px-2 py-2 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-blue-800 transition-colors">
                <td className="px-2 py-2 font-semibold">{log.source}</td>
                <td className="px-2 py-2">
                  {log.message}{' '}
                  <span className="transition-colors">
                    {log.metadata && JSON.stringify(log.metadata)}
                  </span>
                </td>
                <td className="transition-colors">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
