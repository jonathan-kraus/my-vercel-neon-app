'use client'

import { useEffect, useState } from 'react'

export default function LogViewer() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    fetch('/api/logs')
      .then((res) => res.json())
      .then(setLogs)
      .catch((err) => console.error('Log fetch failed:', err))
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Recent Logs</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Timestamp</th>
            <th className="p-2 text-left">Severity</th>
            <th className="p-2 text-left">Source</th>
            <th className="p-2 text-left">Message</th>
            <th className="p-2 text-left">Request ID</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="p-2">{log.severity}</td>
              <td className="p-2">{log.source}</td>
              <td className="p-2">{log.message}</td>
              <td className="p-2">{log.requestId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
