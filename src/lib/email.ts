import nodemailer from "nodemailer";
import ical from "ical-generator";
import { getEventTicketEmailTemplate } from "@/lib/email/templates/events";
import { generateTicketPNG } from "@/lib/ticketCode";

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  cid?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

function isSMTPConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

const globalForEmail = globalThis as unknown as {
  emailTransporter: MailTransporter | undefined;
};

function getTransporter(): MailTransporter {
  if (!globalForEmail.emailTransporter) {
    globalForEmail.emailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return globalForEmail.emailTransporter;
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: EmailOptions): Promise<boolean> {
  if (!isSMTPConfigured()) {
    console.warn("SMTP not configured. Email not sent:", { to, subject });
    return false;
  }

  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"NEIIST" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export function generateEventIcs(event: {
  title: string;
  description?: string;
  location?: string | string[];
  start: Date | string;
  end?: Date | string | null;
  url?: string;
}): string {
  const calendar = ical({ name: "NEIIST Eventos" });
  const startDate = new Date(event.start);
  const endDate = event.end
    ? new Date(event.end)
    : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const loc = Array.isArray(event.location) ? event.location.join(", ") : event.location;

  calendar.createEvent({
    start: startDate,
    end: endDate,
    summary: event.title,
    description: event.description || "",
    location: loc || undefined,
    url: event.url || process.env.NEXT_PUBLIC_BASE_URL,
  });

  return calendar.toString();
}

/**
 * Sends the confirmed event ticket email (QR PNG + .ics attachments).
 * Shared by the event sign-up route and the paid-order ticket hooks.
 */
export async function sendEventTicketEmail(params: {
  eventId: string;
  eventTitle: string;
  eventDescription?: string | null;
  eventLocation?: string | string[] | null;
  eventStart: string | Date;
  eventEnd?: string | Date | null;
  attendeeName: string;
  recipientEmail: string;
  ticketCode: string;
  formResponses?: Record<string, unknown> | null;
  orderNumber?: string | null;
}): Promise<boolean> {
  const {
    eventId,
    eventTitle,
    eventDescription,
    eventLocation,
    eventStart,
    eventEnd,
    attendeeName,
    recipientEmail,
    ticketCode,
    formResponses,
    orderNumber,
  } = params;

  const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/activities/${eventId}/ticket`;
  const qrPng = await generateTicketPNG(ticketCode);
  const icsContent = generateEventIcs({
    title: eventTitle,
    description: eventDescription ?? undefined,
    location: eventLocation ?? undefined,
    start: eventStart,
    end: eventEnd,
    url: ticketUrl,
  });

  const html = getEventTicketEmailTemplate({
    eventTitle,
    eventStart,
    eventEnd,
    location: eventLocation ?? undefined,
    ticketCode,
    attendeeName,
    orderNumber,
    formResponses,
    ticketUrl,
    hasCidQr: true,
  });

  return sendEmail({
    to: recipientEmail,
    subject: `[NEIIST] Bilhete Confirmado: ${eventTitle}`,
    html,
    attachments: [
      {
        filename: "ticket-qr.png",
        content: qrPng,
        cid: "ticket-qr-code",
        contentType: "image/png",
      },
      {
        filename: `${eventTitle.replace(/[^a-zA-Z0-9]/g, "_")}.ics`,
        content: icsContent,
        contentType: "text/calendar; charset=utf-8",
      },
    ],
  });
}
