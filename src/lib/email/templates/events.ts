import { escapeHtml, renderBaseEmailLayout } from "@/lib/email/baseEmail";

export function getEventTicketEmailTemplate(data: {
  eventTitle: string;
  eventStart: Date | string;
  eventEnd?: Date | string | null;
  location?: string | string[];
  ticketCode: string;
  attendeeName: string;
  orderNumber?: string | null;
  formResponses?: Record<string, unknown> | null;
  ticketUrl?: string;
  qrCodeDataUri?: string;
  hasCidQr?: boolean;
}): string {
  const startDate = new Date(data.eventStart);
  const formattedStart = !isNaN(startDate.getTime())
    ? startDate.toLocaleString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : String(data.eventStart);

  const loc = Array.isArray(data.location) ? data.location.join(", ") : data.location;
  const ticketPassUrl = data.ticketUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/my-tickets`;
  const safeAttendeeName = escapeHtml(data.attendeeName);
  const safeEventTitle = escapeHtml(data.eventTitle);
  const safeTicketCode = escapeHtml(data.ticketCode);
  const safeFormattedStart = escapeHtml(formattedStart);
  const safeLoc = loc ? escapeHtml(loc) : "";
  const safeOrderNumber = data.orderNumber ? escapeHtml(data.orderNumber) : "";
  const safeTicketPassUrl = escapeHtml(ticketPassUrl);

  const formResponsesHtml =
    data.formResponses && Object.keys(data.formResponses).length > 0
      ? `
        <div style="margin-top: 1.5rem; background: #fff; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; text-align: left;">
          <h4 style="margin: 0 0 0.5rem 0; color: #1e293b; font-size: 0.95rem;">Respostas ao Formulário de Inscrição:</h4>
          <ul style="margin: 0; padding-left: 1.25rem; color: #475569; font-size: 0.9rem;">
            ${Object.entries(data.formResponses)
              .map(
                ([k, v]) =>
                  `<li style="margin-bottom: 0.25rem;"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(typeof v === "boolean" ? (v ? "Sim" : "Não") : String(v))}</li>`
              )
              .join("")}
          </ul>
        </div>
      `
      : "";

  const qrImgSrc = data.hasCidQr ? "cid:ticket-qr-code" : data.qrCodeDataUri || "";

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 0.5rem;">O teu bilhete está confirmado!</h2>
    <p style="font-size: 1.1rem; margin-top: 0;">Olá ${safeAttendeeName}!</p>
    <p>A tua inscrição para o evento <strong>${safeEventTitle}</strong> foi confirmada com sucesso.</p>

    <div style="background: #ffffff; border-radius: 1rem; padding: 1.5rem; margin: 1.5rem 0; text-align: center; border: 2px dashed #2863FD;">
      <span style="display: inline-block; background: #EEF2FF; color: #2863FD; font-size: 0.85rem; font-weight: bold; padding: 0.25rem 0.75rem; border-radius: 1rem; margin-bottom: 1rem;">
        CÓDIGO DE ENTRADA
      </span>
      <div style="font-size: 1.75rem; font-weight: bold; letter-spacing: 2px; color: #1e293b; margin-bottom: 1rem;">
        ${safeTicketCode}
      </div>
      ${
        qrImgSrc
          ? `<div style="margin: 1rem auto;">
               <img src="${qrImgSrc}" alt="QR Code Bilhete" width="180" height="180" style="border-radius: 0.5rem; display: block; margin: 0 auto;" />
               <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">Apresenta este código QR à entrada do evento</p>
             </div>`
          : ""
      }
      <a href="${safeTicketPassUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2863FD; color: #ffffff; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold; margin-top: 0.75rem;">
        Abrir Bilhete no Telemóvel
      </a>
    </div>

    <div style="background: #ffffff; border-radius: 0.75rem; padding: 1rem; margin: 1rem 0; text-align: left;">
      <p style="margin: 0.25rem 0;"><strong>Data & Hora:</strong> ${safeFormattedStart}</p>
      ${safeLoc ? `<p style="margin: 0.25rem 0;"><strong>Localização:</strong> ${safeLoc}</p>` : ""}
      ${safeOrderNumber ? `<p style="margin: 0.25rem 0;"><strong>Encomenda:</strong> ${safeOrderNumber}</p>` : ""}
    </div>

    ${formResponsesHtml}

    <p style="font-size: 0.9rem; color: #64748b; margin-top: 1.5rem;">
      Em anexo encontrarás o convite de calendário (<code>.ics</code>) para adicionares o evento ao teu Google Calendar / Apple Calendar.
    </p>
  `;

  return renderBaseEmailLayout({ content });
}

export function getEventCancelledEmailTemplate(data: {
  eventTitle: string;
  attendeeName: string;
  reason?: string;
}): string {
  const content = `
    <h2 style="color: #ef4444; margin-bottom: 0.5rem;">Inscrição Cancelada</h2>
    <p style="font-size: 1.1rem; margin-top: 0;">Olá ${escapeHtml(data.attendeeName)}!</p>
    <p>Confirmamos que a tua inscrição para o evento <strong>${escapeHtml(data.eventTitle)}</strong> foi cancelada.</p>
    ${data.reason ? `<p><strong>Motivo:</strong> ${escapeHtml(data.reason)}</p>` : ""}
    <p>A tua vaga foi libertada e o teu código de bilhete foi invalidado no scanner de entrada.</p>
    <p>Se mudares de ideias ou precisares de ajuda, visita a nossa página de atividades ou contacta a coordenação.</p>
  `;

  return renderBaseEmailLayout({ content });
}

export function getEventReminderEmailTemplate(data: {
  eventTitle: string;
  eventStart: Date | string;
  eventEnd?: Date | string | null;
  location?: string | string[];
  attendeeName: string;
  ticketCode: string;
  qrCodeDataUri?: string;
  hasCidQr?: boolean;
  ticketUrl?: string;
}): string {
  const startDate = new Date(data.eventStart);
  const formattedStart = !isNaN(startDate.getTime())
    ? startDate.toLocaleString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : String(data.eventStart);

  const loc = Array.isArray(data.location) ? data.location.join(", ") : data.location;
  const qrImgSrc = data.hasCidQr ? "cid:ticket-qr-code" : data.qrCodeDataUri || "";
  const ticketPassUrl = escapeHtml(
    data.ticketUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/my-tickets`
  );

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 0.5rem;">Lembrete: O evento é amanhã!</h2>
    <p style="font-size: 1.1rem; margin-top: 0;">Olá ${escapeHtml(data.attendeeName)}!</p>
    <p>Falta pouco para o início de <strong>${escapeHtml(data.eventTitle)}</strong>. Aqui estão os detalhes para a tua chegada:</p>

    <div style="background: #ffffff; border-radius: 0.75rem; padding: 1.25rem; margin: 1.5rem 0; border-left: 4px solid #2863FD; text-align: left;">
      <p style="margin: 0.25rem 0;"><strong>Data & Hora:</strong> ${escapeHtml(formattedStart)}</p>
      ${loc ? `<p style="margin: 0.25rem 0;"><strong>Localização:</strong> ${escapeHtml(loc)}</p>` : ""}
      <p style="margin: 0.25rem 0;"><strong>Código do Bilhete:</strong> <code>${escapeHtml(data.ticketCode)}</code></p>
    </div>

    ${
      qrImgSrc
        ? `<div style="text-align: center; margin: 1.5rem 0;">
             <img src="${qrImgSrc}" alt="QR Code" width="160" height="160" style="border-radius: 0.5rem;" />
             <p style="font-size: 0.8rem; color: #64748b;">Tem o QR code pronto no telemóvel à entrada</p>
           </div>`
        : ""
    }

    <div style="text-align: center; margin-top: 1rem;">
      <a href="${ticketPassUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2863FD; color: #ffffff; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold;">
        Aceder ao Bilhete Digital
      </a>
    </div>
  `;

  return renderBaseEmailLayout({ content });
}
