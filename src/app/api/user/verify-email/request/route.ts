import { NextResponse } from "next/server";
import crypto from "crypto";
import { addEmailVerification } from "@/utils/dbUtils";
import { sendEmail, getEmailVerificationTemplate } from "@/utils/emailUtils";

export async function POST(request: Request) {
  const { istid, alternativeEmail } = await request.json();
  if (!istid || !alternativeEmail) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min life for the token
  try {
    await addEmailVerification(istid, alternativeEmail, token, expiresAt);
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/verify-email/confirm?token=${token}`;
    await sendEmail({
      to: alternativeEmail,
      subject: "Verifique o seu email alternativo",
      html: getEmailVerificationTemplate(verifyUrl),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in email verification request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
