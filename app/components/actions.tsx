'use server';

import { sendConfirmationEmail } from '../utils/sendemail';

export async function triggerEmail(jname: string, requestId?: string) {
  await sendConfirmationEmail('jonathanckraus@gmail.com', jname, requestId ? requestId : 'no-request-id');
}
