import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const mailerSend = new MailerSend({
  apiKey: "mlsn.12387b37da7114b5f3b9228c6894f606b08a0619200d54e341b8138324a703ce"
});

const sentFrom = new Sender("Jonathan@kraus.my.id", "Jonathan");
// const sentFrom = new Sender("J@test-51ndgwv663dlzqx8.mlsender.net", "Jonathan");
const jemail = "jonathanckraus@gmail.com";
const recipients = [
  new Recipient(jemail, "JKGMail"),
];

const emailParams = new EmailParams()
  .setFrom(sentFrom)
  .setTo(recipients)
  .setReplyTo(sentFrom)
  .setSubject("Mail Success")
  .setHtml(`<strong>Sent from my neonvercelJ ${jemail} app</strong>`)
  .setText(`Sent from my neonvercelJ ${jemail} app`);

await mailerSend.email.send(emailParams);
console.log('✅ Email sent from utilssuccessfully to:', jemail);