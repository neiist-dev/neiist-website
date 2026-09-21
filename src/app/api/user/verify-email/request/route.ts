import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail, getEmailVerificationTemplate } from "@/lib/email";
import { addEmailVerification } from "@/lib/db/repositories/user.repository";
import { handleApiError } from "@/utils/apiErrorUtils";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { isValidEmail } from "@/utils/apiValidationUtils";

export async function POST(request: Request) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { user } = session;

  try {
    const { istid, alternativeEmail } = await request.json();
    if (!istid || !alternativeEmail || !isValidEmail(alternativeEmail))
      return NextResponse.json({ error: "Missing or invalid data" }, { status: 400 });

    const canManageUsers = hasPermission(user, "users:write");
    if (user.istid !== istid && !canManageUsers)
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await addEmailVerification(istid, alternativeEmail, token, expiresAt);
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/verify-email/confirm?token=${token}`;
    await sendEmail({
      to: alternativeEmail,
      subject: "Verifique o seu email alternativo",
      html: getEmailVerificationTemplate(verifyUrl),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
