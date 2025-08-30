"use client";
import { useState } from 'react';

export default function SendEmailButton({ post }: { post: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSendEmail() {
    setLoading(true);
    setSuccess(false);
    const res = await fetch('/api/send-post-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        to: 'your@email.com', // Change to your recipient
      }),
    });
    setLoading(false);
    if (res.ok) setSuccess(true);
  }

  return (
    <div>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleSendEmail}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Post via Email'}
      </button>
      {success && <p className="text-green-600 mt-2">Email sent!</p>}
    </div>
  );
}
