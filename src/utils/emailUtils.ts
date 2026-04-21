import nodemailer from "nodemailer";
import { OrderKind, getOrderKindRules } from "@/types/shop";
import { getColorFromOptions } from "./shopUtils";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function isSMTPConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function formatVariantLabel(
  variantLabel?: string,
  variantOptions?: Record<string, string>
): string {
  const colorInfo = getColorFromOptions(variantOptions, variantLabel);
  const colorName = colorInfo.name ?? "";
  let size = "";
  if (variantOptions) size = variantOptions.Tamanho || variantOptions.Size || "";

  if (!size && variantLabel) {
    const m = variantLabel.match(/(XS|S|M|L|XL|XXL)/);
    if (m) size = m[1];
  }
  return [colorName, size].filter(Boolean).join(" - ");
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  if (!isSMTPConfigured()) {
    console.warn("SMTP not configured. Email not sent:", { to, subject });
    return; // Silently skip email sending
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
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

type OrderEmailItem = {
  product_name: string;
  variant_label?: string;
  variant_options?: Record<string, string>;
  quantity: number;
  unit_price: number;
};

function formatCampus(campus?: string): string {
  if (!campus) return "";

  return campus.charAt(0).toUpperCase() + campus.slice(1);
}

function getCampusLocation(campus?: string): string {
  if (!campus) return "uma banca NEIIST";

  const campusLower = campus.toLowerCase();
  if (campusLower === "alameda") return "Sala NEIIST Alameda (Informática I 3.03)";

  if (campusLower === "taguspark") return "Sala NEIIST Taguspark (1 - 4.14)";

  return `banca NEIIST em ${formatCampus(campus)}`;
}

function formatDeadline(pickupDeadline?: string | null): string {
  if (!pickupDeadline) return "72 horas após a criação da encomenda";

  const dt = new Date(pickupDeadline);
  if (Number.isNaN(dt.getTime())) return "72 horas após a criação da encomenda";

  return dt.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderItemsTable(items: OrderEmailItem[], total: number): string {
  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 0.5rem; border-bottom: 1px solid #e9ecef;">
            ${item.product_name}
            ${
              formatVariantLabel(item.variant_label, item.variant_options)
                ? ` - ${formatVariantLabel(item.variant_label, item.variant_options)}`
                : ""
            }
          </td>
          <td style="padding: 0.5rem; border-bottom: 1px solid #e9ecef; text-align: center;">${item.quantity}</td>
          <td style="padding: 0.5rem; border-bottom: 1px solid #e9ecef; text-align: right;">€${item.unit_price.toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <h3 style="color: #2863FD; margin-top: 2rem;">Resumo da Encomenda</h3>
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
  `;
}

export function getEmailVerificationTemplate(verifyUrl: string): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.svg`;

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

export function getOrderPendingTemplate(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: string,
  pickupDeadline?: string | null
): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.svg`;

  const paymentText: Record<string, string> = {
    "in-person": `Presencial numa banca NEIIST (${getCampusLocation(campus)}).`,
    cash: `Numerário numa banca NEIIST (${getCampusLocation(campus)}).`,
    other: "Transferência/MB Way (aguarda validação manual pela equipa da loja).",
    "sumup-tpa": "Cartao no terminal SumUp POS (confirmacao no dispositivo).",
    sumup: "Cartão online via SumUp",
    "apple-pay": "Apple Pay via SumUp",
  };
  const deadlineText = formatDeadline(pickupDeadline);

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333;">
      <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1rem;" />
      <h2 style="color: #2863FD; margin-bottom: 1rem;">Encomenda Pendente</h2>
      <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
      <p>A tua encomenda <strong>#${orderNumber}</strong> foi registada e encontra-se <strong>pendente</strong>.</p>
      <p><strong>Atenção:</strong> a encomenda só fica confirmada depois do pagamento.</p>
      <p><strong>Onde pagar:</strong> ${paymentText[paymentMethod || ""] || `Banca NEIIST (${getCampusLocation(campus)})`}</p>
      <p><strong>Prazo limite de pagamento:</strong> ${deadlineText}. Se não for paga até esta data, a encomenda é automaticamente cancelada.</p>

      ${renderItemsTable(items, total)}

      ${campus ? `<p><strong>Campus de levantamento:</strong> ${formatCampus(campus)}</p>` : ""}
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;" />
      <p style="font-size: 0.9rem; color: #6c757d;">NEIIST &mdash; Núcleo Estudantil de Informática do IST</p>
    </div>
  `;
}

export function getOrderPaidTemplate(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: string,
  paymentReference?: string
): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.svg`;

  const presencialText = `Presencial numa banca do NEIIST ou na ${getCampusLocation(campus)}.`;
  const paymentMethodLabels: Record<string, string> = {
    "in-person": presencialText,
    cash: presencialText,
    other: presencialText,
    "sumup-tpa": "Cartão via TPA SumUp",
    sumup: "Cartão online via SumUp",
    "apple-pay": "Apple Pay via SumUp",
  };
  const paymentMethodText = paymentMethod
    ? paymentMethodLabels[paymentMethod] || paymentMethod
    : undefined;

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333;">
      <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1rem;" />
      <h2 style="color: #2863FD; margin-bottom: 1rem;">Pagamento Confirmado</h2>
      <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
      <p>O pagamento da tua encomenda <strong>#${orderNumber}</strong> foi confirmado com sucesso.</p>

      ${renderItemsTable(items, total)}

      ${campus ? `<p><strong>Campus de levantamento:</strong> ${formatCampus(campus)}</p>` : ""}
      ${paymentMethodText ? `<p><strong>Método de pagamento:</strong> ${paymentMethodText}</p>` : ""}
      ${paymentReference ? `<p><strong>Referência de pagamento:</strong> ${paymentReference}</p>` : ""}

      <p style="margin-top: 1.25rem;">Receberás novo email quando a encomenda estiver pronta para levantamento.</p>

      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;" />
      <p style="font-size: 0.9rem; color: #6c757d;">NEIIST &mdash; Núcleo Estudantil de Informática do IST</p>
    </div>
  `;
}

export function getJantarDeCursoPendingTemplate(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  pickupDeadline?: string | null
): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.svg`;
  const deadlineText = formatDeadline(pickupDeadline);
  // TODO: implement dynamic MBWay number allocation from a configured pool. (Ask for identificarition on mbway their istid)

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333;">
      <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1rem;" />
      <h2 style="color: #2863FD; margin-bottom: 1rem;">Jantar de Curso - Encomenda Pendente</h2>
      <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
      <p>A tua reserva para o <strong>Jantar de Curso</strong> (#${orderNumber}) foi registada com sucesso.</p>
      <p><strong>Pagamento:</strong> presencial na sala do NEIIST (${getCampusLocation(campus)}).</p>
      <p>Deve ser feito numa banca NEIIST, o pagamento irá ser confirmado por um membro da equipa.</p>
      <p><strong>Prazo limite:</strong> ${deadlineText}. Após esse prazo a reserva pode ser cancelada automaticamente.</p>

      ${renderItemsTable(items, total)}

      ${campus ? `<p><strong>Campus selecionado:</strong> ${formatCampus(campus)}</p>` : ""}
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;" />
      <p style="font-size: 0.9rem; color: #6c757d;">NEIIST &mdash; Núcleo Estudantil de Informática do IST</p>
    </div>
  `;
}

export function getJantarDeCursoPaidTemplate(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentReference?: string
): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.svg`;

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333;">
      <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1rem;" />
      <h2 style="color: #2863FD; margin-bottom: 1rem;">Jantar de Curso - Pagamento Confirmado</h2>
      <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
      <p>Recebemos o teu pagamento para a reserva <strong>#${orderNumber}</strong> do Jantar de Curso.</p>

      ${renderItemsTable(items, total)}

      ${campus ? `<p><strong>Campus selecionado:</strong> ${formatCampus(campus)}</p>` : ""}
      ${paymentReference ? `<p><strong>Referência de pagamento:</strong> ${paymentReference}</p>` : ""}
      <p style="margin-top: 1.25rem;">A tua inscrição será validada automaticamente após confirmação final do pagamento.</p>

      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;" />
      <p style="font-size: 0.9rem; color: #6c757d;">NEIIST &mdash; Núcleo Estudantil de Informática do IST</p>
    </div>
  `;
}

export function getOrderStatusUpdateTemplate(
  orderNumber: string,
  customerName: string,
  status: string,
  statusLabel: string,
  campus?: string
): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.svg`;

  const statusMessages: Record<string, string> = {
    paid: "O estado da tua encomenda foi atualizado para pago.",
    ready: "A tua encomenda está pronta para levantamento!",
    delivered: "A tua encomenda foi entregue com sucesso!",
    cancelled: "A tua encomenda foi cancelada pela equipa da loja.",
  };

  const message =
    statusMessages[status] || `O estado da tua encomenda foi atualizado para: ${statusLabel}`;

  const campusLocation = getCampusLocation(campus);

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333;">
      <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1rem;" />
      <h2 style="color: #2863FD; margin-bottom: 1rem;">Atualização do Estado da Encomenda</h2>
      <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
      <p>${message}</p>
      <p><strong>Número da encomenda:</strong> #${orderNumber}</p>
      <p><strong>Estado atual:</strong> ${statusLabel}</p>

      ${
        status === "ready" && campusLocation
          ? `<p>A tua encomenda está pronta para ser levantada no <strong>${campusLocation}</strong>. Consulta as nossas redes sociais para saber os horários de funcionamento!</p>`
          : status === "ready"
            ? `<p>A tua encomenda está pronta para ser levantada no campus selecionado. Consulta as nossas redes sociais para saber os horários de funcionamento!</p>`
            : ""
      }

      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;" />
      <p style="font-size: 0.9rem; color: #6c757d;">NEIIST &mdash; Núcleo Estudantil de Informática do IST</p>
    </div>
  `;
}

export function getOrderAutoCancelledTemplate(
  orderNumber: string,
  customerName: string,
  campus?: string
): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.svg`;

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333;">
      <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1rem;" />
      <h2 style="color: #2863FD; margin-bottom: 1rem;">Encomenda Cancelada Automaticamente</h2>
      <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
      <p>A tua encomenda <strong>#${orderNumber}</strong> foi cancelada automaticamente por falta de pagamento dentro do prazo.</p>
      <p>Se ainda quiseres os produtos, podes fazer uma nova encomenda no site.</p>
      ${campus ? `<p><strong>Campus selecionado:</strong> ${formatCampus(campus)}</p>` : ""}
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;" />
      <p style="font-size: 0.9rem; color: #6c757d;">NEIIST &mdash; Núcleo Estudantil de Informática do IST</p>
    </div>
  `;
}

export function getPendingOrderEmailTemplate(
  orderKind: OrderKind,
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: string,
  pickupDeadline?: string | null
): string {
  const templateKey = getOrderKindRules(orderKind).emailTemplates.pending;

  if (templateKey === "jantar_pending") {
    return getJantarDeCursoPendingTemplate(
      orderNumber,
      customerName,
      items,
      total,
      campus,
      pickupDeadline
    );
  }

  return getOrderPendingTemplate(
    orderNumber,
    customerName,
    items,
    total,
    campus,
    paymentMethod,
    pickupDeadline
  );
}

export function getPaidOrderEmailTemplate(
  orderKind: OrderKind,
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: string,
  paymentReference?: string
): string {
  const templateKey = getOrderKindRules(orderKind).emailTemplates.paid;

  if (templateKey === "jantar_paid") {
    return getJantarDeCursoPaidTemplate(
      orderNumber,
      customerName,
      items,
      total,
      campus,
      paymentReference
    );
  }

  return getOrderPaidTemplate(
    orderNumber,
    customerName,
    items,
    total,
    campus,
    paymentMethod,
    paymentReference
  );
}

export function getAutoCancelledOrderEmailTemplate(
  _orderKind: OrderKind,
  orderNumber: string,
  customerName: string,
  campus?: string
): string {
  return getOrderAutoCancelledTemplate(orderNumber, customerName, campus);
}

export function getStatusUpdateOrderEmailTemplate(
  _orderKind: OrderKind,
  orderNumber: string,
  customerName: string,
  status: string,
  statusLabel: string,
  campus?: string
): string {
  return getOrderStatusUpdateTemplate(orderNumber, customerName, status, statusLabel, campus);
}
