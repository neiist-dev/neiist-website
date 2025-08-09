import nodemailer from "nodemailer";

export async function sendMail({ to, subject, html }: { to: string, subject: string, html: string }) {
  console.log("[sendMail] Preparing to send email", { to, subject });
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // Ethereal usa STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `NEIIST <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    if (nodemailer.getTestMessageUrl) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) console.log("[sendMail] Preview URL:", url); // TODO - Remover
    }
    return info;
  } catch (error) {
    console.error("[sendMail] Erro ao enviar email:", error);
    throw error;
  }
}
