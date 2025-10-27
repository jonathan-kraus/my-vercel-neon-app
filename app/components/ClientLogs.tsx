'use client';

import { useEffect, useState } from 'react';
import { LogSearch } from './LogSearch';
import { SessionCheck } from './SessionCheck';
import type { Prisma } from '@prisma/client';

type LogEntry = {
  id: string;
  severity: string;
  source: string;
  message: string;
  requestId: string | null;
  metadata?: Prisma.JsonValue | null;
  timestamp: string;
};

// Utility to flatten metadata into a searchable string
function flattenMetadata(meta: unknown): string {
  if (typeof meta === 'string' || typeof meta === 'number' || typeof meta === 'boolean') {
    return String(meta);
  }

  if (Array.isArray(meta)) {
    return meta.map(flattenMetadata).join(' ');
  }

  if (typeof meta === 'object' && meta !== null) {
    return Object.values(meta).map(flattenMetadata).join(' ');
  }

  return '';
}

export default function ClientLogs({ logs: initialLogs }: { logs: LogEntry[] }) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/logs')
      .then((res) => res.json())
      .then((data) => setLogs(data));
  }, []);

  const matchesQuery = (log: LogEntry, query: string): boolean => {
    const q = query.toLowerCase();
    const metadataString = flattenMetadata(log.metadata).toLowerCase();

    return (
      (log.message?.toLowerCase().includes(q) ||
        log.source?.toLowerCase().includes(q) ||
        log.severity?.toLowerCase().includes(q) ||
        metadataString.includes(q) ||
        log.requestId?.toLowerCase().includes(q)) ??
      false
    );
  };

  const filteredLogs = logs.filter((log) => matchesQuery(log, searchQuery));

  return (
    <div className="p-6">
      <SessionCheck />
      <h1 className="text-2xl font-bold mb-4">Recent Logs</h1>
      <LogSearch onSearch={setSearchQuery} />
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Timestamp</th>
            <th className="border px-4 py-2 text-left">Severity</th>
            <th className="border px-4 py-2 text-left">Source</th>
            <th className="border px-4 py-2 text-left">Message</th>
            <th className="border px-4 py-2 text-left">Metadata</th>
            <th className="border px-4 py-2 text-left">Request ID</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="px-4 py-2">{log.severity}</td>
              <td className="px-4 py-2">{log.source}</td>
              <td className="px-4 py-2">{log.message}</td>
              <td className="px-4 py-2">{flattenMetadata(log.metadata)}</td>
              <td className="px-4 py-2">{log.requestId ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
