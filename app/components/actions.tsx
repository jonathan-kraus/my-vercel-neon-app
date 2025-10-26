'use server';

import { sendEmailDirect } from '../utils/sendemail';

export async function triggerEmail(
  jname: string,
  requestId?: string,
  subject?: string,
  message?: string
) {
  await sendEmailDirect(
    'jonathanckraus@gmail.com',
    jname,
    requestId ? requestId : 'no-request-id',
    subject ? subject : 'No Subject',
    message ? message : 'No Message'
  );
}
