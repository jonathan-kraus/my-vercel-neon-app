'use server';

export async function triggerEmail(
  jname: string,
  requestId?: string,
  subject?: string,
  message?: string
) {
  // Dynamically import to avoid loading the email module during build/module evaluation
  const { sendEmailDirect } = await import('../utils/sendemail');
  await sendEmailDirect(
    'jonathanckraus@gmail.com',
    jname,
    requestId ? requestId : 'no-request-id',
    subject ? subject : 'No Subject',
    message ? message : 'No Message'
  );
}
