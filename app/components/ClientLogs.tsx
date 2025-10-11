'use client';

import { useState } from 'react';
import { LogSearch } from './LogSearch';
import type { Prisma } from '@prisma/client';


type LogEntry = {
  id: string;
  severity: string;
  source: string;
  message: string;
  requestId: string | null;
  metadata?: Prisma.JsonValue;
  timestamp: string;
};

export default function ClientLogs({ logs }: { logs: LogEntry[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.severity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.requestId?.toLowerCase().includes(searchQuery.toLowerCase() ?? false)
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Recent Logs</h1>
      <LogSearch onSearch={setSearchQuery} />
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Timestamp</th>
            <th className="border px-4 py-2 text-left">Severity</th>
            <th className="border px-4 py-2 text-left">Source</th>
            <th className="border px-4 py-2 text-left">Message</th>
            <th className="border px-4 py-2 text-left">Request ID</th>
            <th className="border px-4 py-2 text-left">Metadata</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{log.timestamp}</td>
              <td className="px-4 py-2">{log.severity}</td>
              <td className="px-4 py-2">{log.source}</td>
              <td className="px-4 py-2">{log.message}</td>
              <td className="px-4 py-2">{log.requestId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
