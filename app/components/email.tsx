'use client'; // This is a Client Component

import { useState } from 'react';
import { sendConfirmationEmail } from '../utils/email-client'; // Import the client utility

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  
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
      alert(`Success! ${message}`);
    } else {
      alert(`Error: ${message}`);
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