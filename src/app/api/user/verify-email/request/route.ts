import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { addEmailVerification } from "@/utils/dbUtils";

export async function POST(request: Request) {
  const { istid, alternativeEmail } = await request.json();
  if (!istid || !alternativeEmail) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min life for the token

  await addEmailVerification(istid, alternativeEmail, token, expiresAt);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/verify-email/confirm?token=${token}`;
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.png`;
  await transporter.sendMail({
    from: `"NEIIST" <${process.env.SMTP_USER}>`,
    to: alternativeEmail,
    subject: "Verifique o seu email alternativo",
    html: 
    ` <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333;">
        <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1rem;" />
        <h2 style="color: #2863FD; margin-bottom: 1rem;">Confirmação de Email Alternativo</h2>
        <p style="font-size: 1.1rem;">Olá!</p>
        <p>Recebemos um pedido para adicionar este email como contacto alternativo na tua conta NEIIST.</p>
        <div style="margin: 2rem 0;">
          <a href="${verifyUrl}" style="background: linear-gradient(90deg,#2863FD 0%,#34D1F9 100%); color: #fff; padding: 0.9em 2em; border-radius: 0.5em; text-decoration: none; font-weight: bold; font-size: 1.1rem; box-shadow: 0 2px 8px rgba(40,99,253,0.08);">
            Confirmar Email
          </a>
        </div>
        <p style="color: #555;">Se não fizeste este pedido, ignora este email.</p>
        <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;" />
        <p style="font-size: 0.9rem; color: #6c757d;">NEIIST &mdash; Núcleo Estudantil de Informática do IST</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
