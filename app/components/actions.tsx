'use server';

export async function triggerEmail(
  jname: string,
  requestId?: string,
  subject?: string | number | Record<string, unknown>,
  message?: string | number | Record<string, unknown>
) {
  // Dynamically import to avoid loading the email module during build/module evaluation
  const { sendEmailDirect } = await import('../utils/sendemail');

  let finalSubject: string;
  if (typeof subject === 'string') {
    finalSubject = subject;
  } else if (typeof subject === 'number') {
    finalSubject = subject.toString();
  } else if (subject && typeof subject === 'object') {
    // If it's an object (like location), create a meaningful subject
    finalSubject = `Weather Update - ${new Date().toLocaleDateString()}`;
  } else {
    finalSubject = 'No Subject';
  }

  let finalMessage: string;
  if (typeof message === 'string') {
    finalMessage = message;
  } else if (typeof message === 'number') {
    finalMessage = message.toString();
  } else if (message && typeof message === 'object') {
    finalMessage = JSON.stringify(message, null, 2);
  } else {
    finalMessage = 'No Message';
  }

  await sendEmailDirect(
    'jonathanckraus@gmail.com',
    jname,
    requestId ? requestId : 'no-request-id',
    finalSubject,
    finalMessage
  );
}
