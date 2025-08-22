import { NextResponse } from "next/server";
import { getSubscribers } from "@/utils/newsletterSubscribers";
import { sendMail } from "@/utils/sendMail";

export async function POST(request: Request) {
  const { subject, html } = await request.json();
  try {
    const emails = await getSubscribers();
    if (emails.length === 0) {
      return NextResponse.json({ error: "Sem subscritores." }, { status: 400 });
    }
    // batches para evitar possíveis problemas de SMTP
    await sendMail({
      to: emails.join(","),
      subject,
      html,
    });
    return NextResponse.json({ success: true, sent: emails.length });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao enviar para subscritores" }, { status: 500 });
  }
}
