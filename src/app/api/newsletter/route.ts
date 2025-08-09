import { NextResponse } from "next/server";
import { sendMail } from "@/utils/sendMail";

export async function POST(request: Request) {
  const { to, subject, html } = await request.json();
  try {
    await sendMail({ to, subject, html });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
  }
}
