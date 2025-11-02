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
  const [pageSize, setPageSize] = useState(75);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [live, setLive] = useState(false);

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
    if (!live) return;

    const interval = setInterval(() => {
      fetchPage();
    }, 11000); // every 11 seconds

    return () => clearInterval(interval);
  }, [live, fetchPage]);
  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  function onFilterApply() {
    // trigger the page reset — useEffect will call fetchPage()
    setPage(1);
  }

  // Function to highlight search terms in text (HTML-escaped to avoid XSS)
  function highlightText(text: string, searchTerms: string[]): string {
    if (!text) return '';

    const escapeHtml = (unsafe: string) =>
      unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const escaped = escapeHtml(text);
    if (!searchTerms.length) return escaped;

    let highlightedText = escaped;
    searchTerms.forEach((term) => {
      if (!term.trim()) return;
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'gi');
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
              // reset to first page; useEffect will trigger fetch
              setPage(1);
            }}
            className="btn"
          >
            Clear
          </button>
          <button onClick={() => setLive((v) => !v)} className="btn">
            {live ? 'Stop Live' : 'Start Live'}
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
                  <div className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-gray-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    <span>Loading…</span>
                  </div>
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
          <option value="75">75</option>
          <option value="125">125</option>
          <option value="250">250</option>
          <option value="500">500</option>
        </select>
        <div className="text-sm text-muted">
          Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}
        </div>
      </div>
    </div>
  );
}
