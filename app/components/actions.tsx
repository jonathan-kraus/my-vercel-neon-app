'use server';

import { sendEmailDirect } from '../utils/sendemail';

export async function triggerEmail(jname: string, requestId?: string, subject?: string) {
  await sendEmailDirect('jonathanckraus@gmail.com',
     jname,
     requestId ? requestId : 'no-request-id',
     subject ? subject : 'No Subject'
  );
}
