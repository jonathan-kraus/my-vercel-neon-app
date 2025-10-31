'use server';

export async function triggerEmail(
  jname: string,
  requestId?: string,
  subject?: string | number | Record<string, unknown>,
  message?: string | number | Record<string, unknown>
) {
  // Dynamically import to avoid loading the email module during build/module evaluation
  const { sendEmailDirect } = await import('../utils/sendemail');
  await sendEmailDirect(
    'jonathanckraus@gmail.com',
    jname,
    requestId ? requestId : 'no-request-id',
    subject ? String(subject) : 'No Subject',
    message ? String(message) : 'No Message'
  );
}
