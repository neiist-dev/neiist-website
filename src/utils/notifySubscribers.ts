import { getSubscribers } from "@/utils/newsletterSubscribers";
import { sendMail } from "@/utils/sendMail";

export async function notifySubscribersOfNewPost(post: { title: string, id: string }) {
  const emails = await getSubscribers();
  if (emails.length === 0) return;
  const subject = `📰 Nova publicação no Blog NEIIST: ${post.title}`;
  const html = `
      <h2 style="color: #3063E6;">Nova publicação no Blog do NEIIST!</h2>
      <p>Olá subscritor(a),</p>
      <p>Foi publicada uma nova entrada no nosso blog:</p>
      <h3 style="color: #3063E6; margin-top: 24px;">${post.title}</h3>
      <p style="margin: 24px 0;">Podes ler o artigo completo clicando no botão abaixo:</p>
      <a href="https://neiist.org/blog/${post.id}" style="display: inline-block; background: #3063E6; color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); border: none; transition: background 0.2s; margin-bottom: 16px; letter-spacing: 0.5px;">Ler o artigo completo</a>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 13px; color: #3063E6;">Recebeste este email porque subscreveste a newsletter do NEIIST.<br>Se não queres receber mais notificações, responde a este email.</p>
  `;
  await sendMail({
    to: emails.join(","),
    subject,
    html,
  });
}
