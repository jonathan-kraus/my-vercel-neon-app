'use server';

import { sendConfirmationEmail } from '../utils/sendemail';

export async function triggerEmail(jname: string) {
  await sendConfirmationEmail('jonathanckraus@gmail.com', jname);
}
