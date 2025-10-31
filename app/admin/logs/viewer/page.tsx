'use client';

import React, { useEffect, useState } from 'react';

type LogItem = {
  id: string;
  severity: string;
  source: string;
  message: string;
  requestId?: string | null;
  metadata?: any;
  timestamp: string;
};

export default function LogViewerPage() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [severity, setSeverity] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (severity) params.set('severity', severity);
    if (source) params.set('source', source);
    if (message) params.set('message', message);
    if (requestId) params.set('requestId', requestId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    try {
      const res = await fetch(`/api/logs/search?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load logs', err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, severity, source, message, requestId, from, to]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  function onFilterApply() {
    setPage(1);
    fetchPage();
  }

  // Function to highlight search terms in text
  function highlightText(text: string, searchTerms: string[]): string {
    if (!searchTerms.length || !text) return text;

    let highlightedText = text;
    searchTerms.forEach((term) => {
      if (!term.trim()) return;
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 text-black px-1 rounded">$1</mark>'
      );
    });

    return highlightedText;
  }

  // Get active search terms (excluding requestId as requested)
  const searchTerms = [severity, source, message].filter((term) => term.trim());

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Log Viewer</h1>

      <section className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          placeholder="severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="input"
        />
        <input
          placeholder="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="input"
        />
        <input
          placeholder="message contains"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input"
        />
        <input
          placeholder="requestId"
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
          className="input"
        />
        <div>
          <label className="block text-sm">From</label>
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm">To</label>
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </div>
        <div className="col-span-3 flex gap-2 mt-2">
          <button onClick={onFilterApply} className="btn">
            Apply filters
          </button>
          <button
            onClick={() => {
              setSeverity('');
              setSource('');
              setMessage('');
              setRequestId('');
              setFrom('');
              setTo('');
              setPage(1);
              fetchPage();
            }}
            className="btn"
          >
            Clear
          </button>
        </div>
      </section>

      <div className="mb-2">
        Total: {total} — Page: {page}
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="p-2">Timestamp</th>
              <th className="p-2">Severity</th>
              <th className="p-2">Source</th>
              <th className="p-2">Message</th>
              <th className="p-2">RequestId</th>
              <th className="p-2">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4">
                  No logs
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2 align-top">{new Date(it.timestamp).toLocaleString()}</td>
                  <td className="p-2 align-top">
                    <span
                      dangerouslySetInnerHTML={{ __html: highlightText(it.severity, searchTerms) }}
                    />
                  </td>
                  <td className="p-2 align-top">
                    <span
                      dangerouslySetInnerHTML={{ __html: highlightText(it.source, searchTerms) }}
                    />
                  </td>
                  <td className="p-2 align-top">
                    <pre
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: highlightText(it.message, searchTerms) }}
                    />
                  </td>
                  <td className="p-2 align-top">{it.requestId}</td>
                  <td className="p-2 align-top">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(it.metadata || {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          className="btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <button
          className="btn"
          onClick={() => setPage((p) => p + 1)}
          disabled={page * pageSize >= total}
        >
          Next
        </button>
        <select
          value={String(pageSize)}
          onChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(1);
          }}
          className="input"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <div className="text-sm text-muted">
          Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}
        </div>
      </div>
    </div>
  );
}
