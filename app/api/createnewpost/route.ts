// app/api/createnewpost/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
//import { logEvent } from "@/app/lib/logger"; // adjust path
import { sendConfirmationEmail } from "@/app/utils/sendemail";
import { triggerEmail } from "@//app/components/actions";

export async function POST(req: NextRequest) {
  const prisma = new PrismaClient();
  const body = await req.json();
  const { title, content, authorId } = body;
  const allowedUserIds = [1, 2, 3]; // ✅ replace with actual allowed IDs
if (!allowedUserIds.includes(authorId)) {
  console.warn(`Unauthorized post attempt by user ${authorId}`);
  return NextResponse.json({ error: "Not allowed to create posts" }, { status: 403 });
}
if (!authorId) {
  console.warn("⚠️ No authorId provided — skipping auth for now");
}

  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId,
        published: true,
      },
    });

    await sendConfirmationEmail(
      "jonathanckraus@gmail.com",
      `Title "${post.title}" content ${post.content} created at ${post.createdAt}`
    );

    await triggerEmail("Createpostj", post.content);

await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        severity: 'info',
        source: 'SideNav',
        message: 'Weather SideNav component clicked',
        requestId: 'createnewpost', // or generate dynamically
        metadata: { userAction: 'navigate' },
      }),
    });

    return NextResponse.json({ success: true, post });
  } catch (err) {
    console.error("❌ Post creation failed:", err);
    return NextResponse.json({ error: "Post creation failed" }, { status: 500 });
  }
}
