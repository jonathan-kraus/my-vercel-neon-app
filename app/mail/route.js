import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
// import { NextResponse } from "next/server";
const mailerSend = new MailerSend({
  apiKey: "mlsn.724bcfc2a6ad6922a4456d8304f4756fe0a7abb59194f0e63d63b91a6a8b4d73",
});

//const sentFrom = new Sender("Jonathan@kraus.my.id", "Jonathan");
const sentFrom = new Sender("J@test-51ndgwv663dlzqx8.mlsender.net", "Jonathan");
const jemail = "jonathanckraus@gmail.com";
const recipients = [
  new Recipient(jemail, "JKGMail"),
];

const emailParams = new EmailParams()
  .setFrom(sentFrom)
  .setTo(recipients)
  .setReplyTo(sentFrom)
  .setSubject("Mail Success")
  .setHtml("<strong>Sent from my neonvercelJ app</strong>")
  .setText("Sent from my neonvercelJ app");

await mailerSend.email.send(emailParams);
console.log('✅ Email sent successfully to:', jemail);
// return NextResponse.json({
//   message: 'Email sent successfully!',
//   recipient: jemail,
//   timestamp: new Date().toISOString(),
// }, { status: 200 });