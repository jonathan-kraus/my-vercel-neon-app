import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendNewPostEmail({ title, content, to }: { title: string; content: string; to: string }) {
  await resend.emails.send({
    from: 'jonathan@yourdomain.com',
    to,
    subject: `New Blog Post: ${title}`,
    html: `<h1>${title}</h1><p>${content}</p>`,
  });
}
