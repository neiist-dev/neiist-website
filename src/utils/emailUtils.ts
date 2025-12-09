import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function isSMTPConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  if (!isSMTPConfigured()) {
    console.warn("SMTP not configured. Email not sent:", { to, subject });
    return; // Silently skip email sending
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"NEIIST" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

export function getEmailVerificationTemplate(verifyUrl: string): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.png`;

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333;">
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
  `;
}

export function getOrderConfirmationTemplate(
  orderNumber: string,
  customerName: string,
  items: Array<{
    product_name: string;
    variant_label?: string;
    quantity: number;
    unit_price: number;
  }>,
  total: number,
  campus?: string,
  paymentMethod?: string
): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.png`;

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 0.5rem; border-bottom: 1px solid #e9ecef;">${item.product_name} ${item.variant_label ? `- ${item.variant_label}` : ""}</td>
          <td style="padding: 0.5rem; border-bottom: 1px solid #e9ecef; text-align: center;">${item.quantity}</td>
          <td style="padding: 0.5rem; border-bottom: 1px solid #e9ecef; text-align: right;">€${item.unit_price.toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333;">
      <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1rem;" />
      <h2 style="color: #2863FD; margin-bottom: 1rem;">Encomenda Confirmada</h2>
      <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
      <p>A tua encomenda <strong>#${orderNumber}</strong> foi confirmada com sucesso.</p>
      
      <h3 style="color: #2863FD; margin-top: 2rem;">Detalhes da Encomenda</h3>
      <table style="width: 100%; margin: 1rem 0; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #dee2e6;">Produto</th>
            <th style="padding: 0.5rem; text-align: center; border-bottom: 2px solid #dee2e6;">Qtd</th>
            <th style="padding: 0.5rem; text-align: right; border-bottom: 2px solid #dee2e6;">Preço</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 1rem 0.5rem; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 1rem 0.5rem; text-align: right; font-weight: bold; color: #2863FD;">€${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${campus ? `<p><strong>Local de Levantamento:</strong> ${campus.charAt(0).toUpperCase() + campus.slice(1)}</p>` : ""}
      ${paymentMethod === "in-person" ? "<p><strong>Pagamento:</strong> Presencial (no levantamento)</p>" : "<p><strong>Pagamento:</strong> Cartão</p>"}
      
      <p style="margin-top: 2rem;">Receberás atualizações sobre o estado da tua encomenda por email.</p>
      
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;" />
      <p style="font-size: 0.9rem; color: #6c757d;">NEIIST &mdash; Núcleo Estudantil de Informática do IST</p>
    </div>
  `;
}

export function getOrderStatusUpdateTemplate(
  orderNumber: string,
  customerName: string,
  status: string,
  statusLabel: string
): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.png`;

  const statusMessages: Record<string, string> = {
    paid: "O pagamento da tua encomenda foi confirmado!",
    ready: "A tua encomenda está pronta para levantamento!",
    delivered: "A tua encomenda foi entregue com sucesso!",
    cancelled: "A tua encomenda foi cancelada.",
  };

  const message =
    statusMessages[status] || `O estado da tua encomenda foi atualizado para: ${statusLabel}`;

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333;">
      <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1rem;" />
      <h2 style="color: #2863FD; margin-bottom: 1rem;">Atualização de Encomenda</h2>
      <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
      <p>${message}</p>
      <p><strong>Encomenda:</strong> #${orderNumber}</p>
      <p><strong>Estado:</strong> ${statusLabel}</p>
      
      ${status === "ready" ? '<p style="margin-top: 1.5rem; padding: 1rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 0.25rem;">Por favor, levanta a tua encomenda no campus indicado durante o horário de funcionamento.</p>' : ""}
      
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;" />
      <p style="font-size: 0.9rem; color: #6c757d;">NEIIST &mdash; Núcleo Estudantil de Informática do IST</p>
    </div>
  `;
}
