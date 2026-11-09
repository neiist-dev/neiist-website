import {
  formatCampus,
  getCampusLocation,
  getColorFromOptions,
  isColorKey,
} from "@/utils/shop/shopUtils";
import type { PaymentMethod } from "@/types/shop/payment";
import { renderBaseEmailLayout } from "@/lib/email/baseEmail";

export function formatVariantForEmail(variantOptions?: Record<string, string>): string {
  if (!variantOptions || Object.keys(variantOptions).length === 0) return "";

  const colorInfo = getColorFromOptions(variantOptions);
  const parts: string[] = [];
  if (colorInfo.hex)
    parts.push(
      `<span style="display:inline-block;width:12px;height:12px;border-radius:12px;background:${colorInfo.hex};margin-right:6px;vertical-align:middle;"></span>`
    );

  const optionParts: string[] = [];
  for (const [key, value] of Object.entries(variantOptions)) {
    if (!isColorKey(key)) optionParts.push(`${key}: ${value}`);
  }
  if (optionParts.length > 0) parts.push(optionParts.join(" "));

  return parts.join("");
}

export type OrderEmailItem = {
  product_name: string;
  variant_label?: string;
  variant_options?: Record<string, string>;
  quantity: number;
  unit_price: number;
  product_type?: string;
  event_id?: string;
};

export function formatPaymentDeadline(paymentDeadline?: string | null): string {
  if (!paymentDeadline) return "72 horas após a criação da encomenda";

  const dt = new Date(paymentDeadline);
  if (Number.isNaN(dt.getTime())) return "72 horas após a criação da encomenda";

  return dt.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPickupDeadline(pickupDeadline?: string | Date | null): string | null {
  if (!pickupDeadline) return null;
  const dt = typeof pickupDeadline === "string" ? new Date(pickupDeadline) : pickupDeadline;
  if (Number.isNaN(dt.getTime())) return null;

  return dt.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const formatDeadline = formatPaymentDeadline;

export function renderItemsTable(items: OrderEmailItem[], total: number): string {
  const itemsHtml = items
    .map((item) => {
      const variant = formatVariantForEmail(item.variant_options);
      const variantText = variant ? ` - ${variant}` : "";
      return `
        <tr>
          <td style="padding: 0.5rem; border-bottom: 1px solid #e9ecef;">
            ${item.product_name}${variantText}
          </td>
          <td style="padding: 0.5rem; border-bottom: 1px solid #e9ecef; text-align: center;">${item.quantity}</td>
          <td style="padding: 0.5rem; border-bottom: 1px solid #e9ecef; text-align: right;">€${item.unit_price.toFixed(2)}</td>
        </tr>
      `;
    })
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

export function getOrderPendingTemplate(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: PaymentMethod,
  paymentDeadline?: string | null,
  orderId?: number
): string {
  const scheduleLink = orderId
    ? ` Consulta o horário aqui: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/my-orders?orderId=${orderId}" target="_blank" rel="noopener noreferrer" style="color: #2863FD; text-decoration: underline;">Horários do NEIIST</a>`
    : "";

  const paymentText: Record<PaymentMethod, string> = {
    cash: `Numerário na Banca (POS) do NEIIST (${getCampusLocation(campus)}).${scheduleLink}`,
    mbway: "MB Way (aguarda confirmação na app).",
    other: "Transferência/Outro (regista a referência no balcão).",
    "sumup-tpa": "Cartão no terminal SumUp POS (confirmação no dispositivo).",
    sumup: "Cartão online via SumUp.",
    "apple-pay": "Apple Pay via SumUp.",
  };
  const deadlineText = formatPaymentDeadline(paymentDeadline);
  const isReservation = !paymentMethod;

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">${isReservation ? "Reserva Registada" : "Encomenda Pendente"}</h2>
    <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
    <p>${
      isReservation
        ? `A tua reserva <strong>${orderNumber}</strong> foi registada.`
        : `A tua encomenda <strong>${orderNumber}</strong> foi registada e encontra-se <strong>pendente</strong>.`
    }</p>
    <p><strong>Atenção:</strong> ${
      isReservation
        ? "a reserva só fica confirmada depois do pagamento na Banca (POS)."
        : "a encomenda só fica confirmada depois do pagamento."
    }</p>
    <p><strong>Onde pagar:</strong> ${
      paymentMethod
        ? paymentText[paymentMethod]
        : `na <strong>Banca (POS)</strong> do NEIIST (${getCampusLocation(campus)}).${scheduleLink}`
    }</p>
    <p><strong>Prazo limite de pagamento:</strong> ${deadlineText}. ${
      isReservation
        ? "Se a reserva não for paga até esta data, é automaticamente cancelada e o stock é libertado."
        : "Se não for paga até esta data, a encomenda é automaticamente cancelada."
    }</p>

    ${renderItemsTable(items, total)}

    ${campus ? `<p><strong>Campus de levantamento:</strong> ${formatCampus(campus)}</p>` : ""}
  `;

  return renderBaseEmailLayout({ content });
}

export function getOrderPaidTemplate(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: PaymentMethod,
  paymentReference?: string,
  pickupDeadline?: string | null
): string {
  const counterText = `Banca (POS) do NEIIST ou ${getCampusLocation(campus)}.`;
  const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: counterText,
    mbway: "MB Way",
    other: counterText,
    "sumup-tpa": "Cartão via TPA SumUp",
    sumup: "Cartão online via SumUp",
    "apple-pay": "Apple Pay via SumUp",
  };
  const paymentMethodText = paymentMethod ? paymentMethodLabels[paymentMethod] : undefined;
  const formattedPickup = formatPickupDeadline(pickupDeadline);

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">Pagamento Confirmado</h2>
    <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
    <p>O pagamento da tua encomenda <strong>${orderNumber}</strong> foi confirmado com sucesso.</p>

    ${renderItemsTable(items, total)}

    ${campus ? `<p><strong>Campus de levantamento:</strong> ${formatCampus(campus)}</p>` : ""}
    ${paymentMethodText ? `<p><strong>Método de pagamento:</strong> ${paymentMethodText}</p>` : ""}
    ${paymentReference ? `<p><strong>Referência de pagamento:</strong> ${paymentReference}</p>` : ""}
    ${formattedPickup ? `<p><strong>Prazo limite para levantamento:</strong> ${formattedPickup}</p>` : ""}

    <p style="margin-top: 1.25rem;">Receberás novo email quando a encomenda estiver pronta para levantamento.</p>
  `;

  return renderBaseEmailLayout({ content });
}

export function getEventTicketPaidTemplate(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentReference?: string
): string {
  const ticketItem =
    items.find(
      (i) => (i as { product_type?: string }).product_type === "event_ticket" || i.event_id
    ) || items[0];
  const eventTitle = ticketItem?.product_name || "Bilhete de Evento";

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">Pagamento Confirmado - ${eventTitle}</h2>
    <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
    <p>Recebemos com sucesso o teu pagamento para a reserva <strong>${orderNumber}</strong> do evento <strong>${eventTitle}</strong>.</p>

    ${renderItemsTable(items, total)}

    ${campus ? `<p><strong>Campus selecionado:</strong> ${formatCampus(campus)}</p>` : ""}
    ${paymentReference ? `<p><strong>Referência de pagamento:</strong> ${paymentReference}</p>` : ""}

    <div style="background: #ffffff; border-radius: 0.75rem; padding: 1.25rem; margin: 1.5rem 0; border-left: 4px solid #2863FD;">
      <p style="margin: 0; font-weight: bold; color: #1e293b;">O teu bilhete digital foi gerado e emitido!</p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #64748b;">
        Receberás em separado o email com o QR Code oficial e o convite de calendário (.ics), ou podes consultar o teu passe digital na tua área pessoal.
      </p>
    </div>

    <div style="text-align: center; margin-top: 1.5rem;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/my-tickets" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2863FD; color: #ffffff; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold;">
        Aceder aos Meus Bilhetes
      </a>
    </div>
  `;

  return renderBaseEmailLayout({ content });
}

export function getEventTicketPendingTemplate(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentDeadline?: string | null,
  _paymentMethod?: PaymentMethod,
  _orderId?: number
): string {
  const deadlineText = formatPaymentDeadline(paymentDeadline);

  const paymentInfo = `
    <p>
      <strong>Pagamento:</strong> na <strong>Banca (POS)</strong> do NEIIST (${getCampusLocation(campus)}).
    </p>
  `;

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">Bilhete de Evento - Reserva Pendente</h2>
    <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
    <p>A tua reserva para o bilhete de evento (${orderNumber}) foi registada com sucesso.</p>
    ${paymentInfo}
    <p><strong>Prazo limite:</strong> ${deadlineText}. Após esse prazo a reserva expira automaticamente para libertar as vagas.</p>

    ${renderItemsTable(items, total)}

    ${campus ? `<p><strong>Campus selecionado:</strong> ${formatCampus(campus)}</p>` : ""}
  `;

  return renderBaseEmailLayout({ content });
}

export function getStatusUpdateOrderEmailTemplate(
  orderNumber: string,
  customerName: string,
  status: string,
  statusLabel: string,
  campus?: string,
  pickupDeadline?: string | null
): string {
  const statusMessages: Record<string, string> = {
    paid: "O estado da tua encomenda foi atualizado para pago.",
    ready: "A tua encomenda está pronta para levantamento!",
    delivered: "A tua encomenda foi entregue com sucesso!",
    cancelled: "A tua encomenda foi cancelada pela equipa da loja.",
  };

  const message =
    statusMessages[status] || `O estado da tua encomenda foi atualizado para: ${statusLabel}`;

  const campusLocation = getCampusLocation(campus);
  const formattedPickup =
    status !== "delivered" && status !== "cancelled" ? formatPickupDeadline(pickupDeadline) : null;

  const pickupNotice = formattedPickup
    ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 0.5rem; margin: 1.25rem 0;">
      <p style="margin: 0; color: #92400e; font-weight: bold;">
        Prazo limite para levantamento: ${formattedPickup}
      </p>
      <p style="margin: 0.25rem 0 0 0; color: #b45309; font-size: 0.9rem;">
        Por favor levanta a tua encomenda na Banca (POS) do NEIIST até esta data.
      </p>
    </div>
    `
    : "";

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">Atualização do Estado da Encomenda</h2>
    <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
    <p>${message}</p>
    <p><strong>Número da encomenda:</strong> ${orderNumber}</p>
    <p><strong>Estado atual:</strong> ${statusLabel}</p>

    ${pickupNotice}

    ${
      status === "ready" && campusLocation
        ? `<p>A tua encomenda está pronta para ser levantada no <strong>${campusLocation}</strong>. Consulta as nossas redes sociais para saber os horários de funcionamento!</p>`
        : status === "ready"
          ? `<p>A tua encomenda está pronta para ser levantada no campus selecionado. Consulta as nossas redes sociais para saber os horários de funcionamento!</p>`
          : ""
    }
  `;

  return renderBaseEmailLayout({ content });
}

export function getAutoCancelledOrderEmailTemplate(
  orderNumber: string,
  customerName: string,
  campus?: string
): string {
  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">Encomenda Cancelada Automaticamente</h2>
    <p style="font-size: 1.1rem;">Olá ${customerName}!</p>
    <p>A tua encomenda <strong>${orderNumber}</strong> foi cancelada automaticamente por falta de pagamento dentro do prazo.</p>
    <p>Se ainda quiseres os produtos, podes fazer uma nova encomenda no site.</p>
    ${campus ? `<p><strong>Campus selecionado:</strong> ${formatCampus(campus)}</p>` : ""}
  `;

  return renderBaseEmailLayout({ content });
}

export function getPendingOrderEmailTemplate(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: PaymentMethod,
  paymentDeadline?: string | null,
  orderId?: number,
  isTicket?: boolean
): string {
  const isTicketOrder =
    isTicket ??
    items.some(
      (i) => (i as { product_type?: string }).product_type === "event_ticket" || i.event_id
    );

  if (isTicketOrder) {
    return getEventTicketPendingTemplate(
      orderNumber,
      customerName,
      items,
      total,
      campus,
      paymentDeadline,
      paymentMethod,
      orderId
    );
  }

  return getOrderPendingTemplate(
    orderNumber,
    customerName,
    items,
    total,
    campus,
    paymentMethod,
    paymentDeadline,
    orderId
  );
}

export function getPaidOrderEmailTemplate(
  orderNumber: string,
  customerName: string,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: PaymentMethod,
  paymentReference?: string,
  isTicket?: boolean,
  pickupDeadline?: string | null
): string {
  const isTicketOrder =
    isTicket ??
    items.some(
      (i) => (i as { product_type?: string }).product_type === "event_ticket" || i.event_id
    );

  if (isTicketOrder) {
    return getEventTicketPaidTemplate(
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
    paymentReference,
    pickupDeadline
  );
}
