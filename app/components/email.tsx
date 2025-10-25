'use client'; // This is a Client Component

import { useState, useEffect } from 'react';
import { sendConfirmationEmail } from '../utils/email-client'; // Import the client utility
import { toast } from 'react-hot-toast';
export default function ContactForm({ sendOnMount = true }: { sendOnMount?: boolean }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sendOnMount) return;
    // Optionally send an email on mount if enabled (kept disabled by default)
    // const emailData = {
    //   toEmail: 'jonathanckraus@gmail.com',
    //   toName: 'Jonathan',
    //   subject: 'Auto Email from Client Component',
    //   requestId: crypto.randomUUID(),
    // };
    // sendConfirmationEmail(emailData).then(() => {}).catch(() => {});
  }, [sendOnMount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailData = {
      toEmail: 'jonathanckraus@gmail.com',
      toName: 'Jonathan',
      subject: 'Test Email from Client Component',
      requestId: crypto.randomUUID(),
    };

    const { success, message } = await sendConfirmationEmail(emailData);

    if (success) {
      toast.success(`Success! ${message}`);
    } else {
      toast.error(`Error: ${message}`);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Confirmation Email'}
      </button>
    </form>
  );
}
