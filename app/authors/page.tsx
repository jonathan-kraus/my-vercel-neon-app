export const dynamic = "force-dynamic";
import { db } from "../lib/db";
import PostCountBadge from '../components/PostCountBadge';
import { sendConfirmationEmail } from "../utils/email-client";

//import { sendConfirmationEmail } from '../utils/sendemail';

const requestId = crypto.randomUUID();
type Author = {
  id: number;
  name: string | null;
  _count?: { posts: number };
};

export default async function AuthorsPage() {
const severity = 'info';
const source = 'AuthorsPage';
const message = `Authors page accessed`;
const metadata = { action: 'fetch', timestamp: new Date().toISOString() };
try {
  console.log('🚀 Authors Starting logic');
    await db.log.create({
      data: {
        severity,
        source,
        message,
        requestId,
        metadata: metadata ?? {},
        timestamp: new Date(),
      },
    })  
  } catch (err) {
    console.error(`❌ ${requestId} [AuthorsPage] Error caught:`, err);
    try {
      const emailData = {
        toEmail: 'jonathanckraus@gmail.com',
        toName: 'Jonathan',
        subject: 'Authors Page Error',
        requestId: requestId,
      };
      const { success, message } = await sendConfirmationEmail(emailData);
      if (success) {
        console.log(`[${requestId}] Email sent successfully: ${message}`);
      } else {
        console.error(`[${requestId}] Email failed: ${message}`);
      }
    } catch (emailErr) {
      console.error(`❌ [${requestId}] Error sending email:`, emailErr);
  }
  const authors: Author[] = await db.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, _count: { select: { posts: true } } },
  });

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authors</h1>
      <ul className="space-y-3">
        {authors.map((a) => (
          <li key={a.id} className="flex items-center justify-between border p-3 rounded">
            <div>
              <div className="font-medium">{a.name ?? 'Unknown'}</div>
            </div>
            <PostCountBadge count={a._count?.posts ?? 0} />
          </li>
        ))}
      </ul>
    </div>
  );
} finally {
        
        try {
      const emailData = {
        toEmail: 'jonathanckraus@gmail.com',
        toName: 'Jonathan',
        subject: `Authors Page Completed Successfully - ${new Date().toISOString()}`,
        requestId: requestId,
      };
      const { success, message } = await sendConfirmationEmail(emailData);
      if (success) {
        console.log(`[${requestId}] Email sent successfully: ${message}`);
      } else {
        console.error(`[${requestId}] Email failed: ${message}`);
      }
    } catch (emailErr) {
          console.error(`❌ [${requestId}] Error sending email:`, emailErr);
        }
      }}  