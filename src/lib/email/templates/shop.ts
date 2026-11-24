import {
  formatCampus,
  getCampusLocation,
  getColorFromOptions,
  isColorKey,
} from "@/utils/shop/shopUtils";
import type { PaymentMethod } from "@/types/shop/payment";
import type { Locale } from "@/i18n/i18n-config";
import { renderBaseEmailLayout } from "@/lib/email/baseEmail";

const SHOP_EMAIL_COPY: Record<
  Locale,
  {
    dateLocale: string;
    defaultCustomer: string;
    greeting: (_name: string) => string;
    paymentDeadlineFallback: string;
    summaryTitle: string;
    colProduct: string;
    colQty: string;
    colPrice: string;
    withdrawalTitle: string;
    withdrawalBodyBefore: string;
    withdrawalBodyAfter: string;
    termsLinkLabel: string;
    ticketTermsTitle: string;
    ticketTermsBody: string;
    pending: {
      reservationTitle: string;
      orderTitle: string;
      reservationIntro: (_orderNumber: string) => string;
      orderIntro: (_orderNumber: string) => string;
      noteLabel: string;
      reservationNote: string;
      orderNote: string;
      whereToPayLabel: string;
      defaultWhereToPay: (_campusLocation: string, _scheduleLink: string) => string;
      scheduleLabel: string;
      scheduleLinkText: string;
      deadlineLabel: string;
      reservationExpiryNote: string;
      orderExpiryNote: string;
      pickupCampusLabel: string;
      paymentText: Record<
        PaymentMethod,
        (_campusLocation: string, _scheduleLink: string) => string
      >;
    };
    paid: {
      title: string;
      intro: (_orderNumber: string) => string;
      pickupCampusLabel: string;
      paymentMethodLabel: string;
      paymentReferenceLabel: string;
      pickupDeadlineLabel: string;
      readyNotice: string;
      counterText: (_campusLocation: string) => string;
      methods: Record<Exclude<PaymentMethod, "cash" | "other">, string>;
    };
    ticketPaid: {
      defaultTitle: string;
      titlePrefix: string;
      intro: (_orderNumber: string, _eventTitle: string) => string;
      selectedCampusLabel: string;
      paymentReferenceLabel: string;
      issuedTitle: string;
      issuedSubtitle: string;
      ctaLabel: string;
    };
    ticketPending: {
      title: string;
      intro: (_orderNumber: string) => string;
      paymentLabel: string;
      paymentLocation: (_campusLocation: string) => string;
      deadlineLabel: string;
      deadlineNote: string;
      selectedCampusLabel: string;
    };
    statusUpdate: {
      title: string;
      orderNumberLabel: string;
      currentStatusLabel: string;
      pickupDeadlineLabel: string;
      pickupDeadlineNote: string;
      defaultMessage: (_statusLabel: string) => string;
      messages: Record<string, string>;
      readyAtLocation: (_campusLocation: string) => string;
      readyFallback: string;
    };
    autoCancelled: {
      title: string;
      intro: (_orderNumber: string) => string;
      reorderNote: string;
      selectedCampusLabel: string;
    };
  }
> = {
  pt: {
    dateLocale: "pt-PT",
    defaultCustomer: "Cliente",
    greeting: (name) => `Olá ${name}!`,
    paymentDeadlineFallback: "72 horas após a criação da encomenda",
    summaryTitle: "Resumo da Encomenda",
    colProduct: "Produto",
    colQty: "Qtd",
    colPrice: "Preço",
    withdrawalTitle: "Desistência e devoluções:",
    withdrawalBodyBefore:
      "tens 14 dias a contar do levantamento para desistir da compra, sem justificação e sem custos, enviando um email para",
    withdrawalBodyAfter:
      "com o número da encomenda. O artigo deve ser devolvido numa das nossas salas, sem uso, sem lavagem e com etiqueta. Condições completas e formulário de desistência:",
    termsLinkLabel: "Termos e Condições",
    ticketTermsTitle: "Bilhetes de eventos:",
    ticketTermsBody:
      "nos termos do artigo 17.º, n.º 1, alínea l), do Decreto-Lei n.º 24/2014, os bilhetes para eventos com data específica não estão abrangidos pelo direito de livre resolução. Condições completas:",
    pending: {
      reservationTitle: "Reserva Registada",
      orderTitle: "Encomenda Pendente",
      reservationIntro: (orderNumber) =>
        `A tua reserva <strong>${orderNumber}</strong> foi registada.`,
      orderIntro: (orderNumber) =>
        `A tua encomenda <strong>${orderNumber}</strong> foi registada e encontra-se <strong>pendente</strong>.`,
      noteLabel: "Atenção:",
      reservationNote: "a reserva só fica confirmada depois do pagamento na Banca.",
      orderNote: "a encomenda só fica confirmada depois do pagamento.",
      whereToPayLabel: "Onde pagar:",
      defaultWhereToPay: (campusLocation, scheduleLink) =>
        `na <strong>Banca (POS)</strong> do NEIIST (${campusLocation}).${scheduleLink}`,
      scheduleLabel: "Consulta o horário aqui:",
      scheduleLinkText: "Horários do NEIIST",
      deadlineLabel: "Prazo limite de pagamento:",
      reservationExpiryNote:
        "Se a reserva não for paga até esta data, é automaticamente cancelada e o stock é libertado.",
      orderExpiryNote: "Se não for paga até esta data, a encomenda é automaticamente cancelada.",
      pickupCampusLabel: "Campus de levantamento:",
      paymentText: {
        cash: (loc, link) => `Numerário na Banca do NEIIST (${loc}).${link}`,
        mbway: () => "MB Way (aguarda confirmação na app).",
        other: () => "Transferência/Outro (regista a referência no balcão).",
        "sumup-tpa": () => "Cartão no terminal SumUp POS (confirmação no dispositivo).",
        sumup: () => "Cartão online via SumUp.",
        "apple-pay": () => "Apple Pay via SumUp.",
      },
    },
    paid: {
      title: "Pagamento Confirmado",
      intro: (orderNumber) =>
        `O pagamento da tua encomenda <strong>${orderNumber}</strong> foi confirmado com sucesso.`,
      pickupCampusLabel: "Campus de levantamento:",
      paymentMethodLabel: "Método de pagamento:",
      paymentReferenceLabel: "Referência de pagamento:",
      pickupDeadlineLabel: "Prazo limite para levantamento:",
      readyNotice: "Receberás novo email quando a encomenda estiver pronta para levantamento.",
      counterText: (loc) => `Banca (POS) do NEIIST ou ${loc}.`,
      methods: {
        mbway: "MB Way",
        "sumup-tpa": "Cartão via TPA SumUp",
        sumup: "Cartão online via SumUp",
        "apple-pay": "Apple Pay via SumUp",
      },
    },
    ticketPaid: {
      defaultTitle: "Bilhete de Evento",
      titlePrefix: "Pagamento Confirmado",
      intro: (orderNumber, eventTitle) =>
        `Recebemos com sucesso o teu pagamento para a reserva <strong>${orderNumber}</strong> do evento <strong>${eventTitle}</strong>.`,
      selectedCampusLabel: "Campus selecionado:",
      paymentReferenceLabel: "Referência de pagamento:",
      issuedTitle: "O teu bilhete digital foi gerado e emitido!",
      issuedSubtitle:
        "Receberás em separado o email com o QR Code oficial e o convite de calendário (.ics), ou podes consultar o teu passe digital na tua área pessoal.",
      ctaLabel: "Aceder aos Meus Bilhetes",
    },
    ticketPending: {
      title: "Bilhete de Evento - Reserva Pendente",
      intro: (orderNumber) =>
        `A tua reserva para o bilhete de evento (${orderNumber}) foi registada com sucesso.`,
      paymentLabel: "Pagamento:",
      paymentLocation: (loc) => `na <strong>Banca (POS)</strong> do NEIIST (${loc}).`,
      deadlineLabel: "Prazo limite:",
      deadlineNote: "Após esse prazo a reserva expira automaticamente para libertar as vagas.",
      selectedCampusLabel: "Campus selecionado:",
    },
    statusUpdate: {
      title: "Atualização do Estado da Encomenda",
      orderNumberLabel: "Número da encomenda:",
      currentStatusLabel: "Estado atual:",
      pickupDeadlineLabel: "Prazo limite para levantamento:",
      pickupDeadlineNote: "Por favor levanta a tua encomenda na Sala do NEIIST até esta data.",
      defaultMessage: (label) => `O estado da tua encomenda foi atualizado para: ${label}`,
      messages: {
        paid: "O estado da tua encomenda foi atualizado para pago.",
        ready: "A tua encomenda está pronta para levantamento!",
        delivered: "A tua encomenda foi entregue com sucesso!",
        cancelled: "A tua encomenda foi cancelada pela equipa da loja.",
      },
      readyAtLocation: (loc) =>
        `A tua encomenda está pronta para ser levantada no <strong>${loc}</strong>. Consulta as nossas redes sociais para saber os horários de funcionamento!`,
      readyFallback:
        "A tua encomenda está pronta para ser levantada no campus selecionado. Consulta as nossas redes sociais para saber os horários de funcionamento!",
    },
    autoCancelled: {
      title: "Encomenda Cancelada Automaticamente",
      intro: (orderNumber) =>
        `A tua encomenda <strong>${orderNumber}</strong> foi cancelada automaticamente por falta de pagamento dentro do prazo.`,
      reorderNote: "Se ainda quiseres os produtos, podes fazer uma nova encomenda no site.",
      selectedCampusLabel: "Campus selecionado:",
    },
  },
  en: {
    dateLocale: "en-GB",
    defaultCustomer: "Customer",
    greeting: (name) => `Hello ${name}!`,
    paymentDeadlineFallback: "72 hours after order creation",
    summaryTitle: "Order Summary",
    colProduct: "Product",
    colQty: "Qty",
    colPrice: "Price",
    withdrawalTitle: "Withdrawal and returns:",
    withdrawalBodyBefore:
      "you have 14 days from pickup to withdraw from your purchase, without giving any reason and at no cost, by sending an email to",
    withdrawalBodyAfter:
      "with your order number. The item must be returned to one of our rooms, unused, unwashed and with tags. Full terms and withdrawal form:",
    termsLinkLabel: "Terms and Conditions",
    ticketTermsTitle: "Event tickets:",
    ticketTermsBody:
      "under Article 17(1)(l) of Decree-Law no. 24/2014, tickets for events on a specific date are not covered by the right of withdrawal. Full terms:",
    pending: {
      reservationTitle: "Reservation Registered",
      orderTitle: "Pending Order",
      reservationIntro: (orderNumber) =>
        `Your reservation <strong>${orderNumber}</strong> has been registered.`,
      orderIntro: (orderNumber) =>
        `Your order <strong>${orderNumber}</strong> has been registered and is currently <strong>pending</strong>.`,
      noteLabel: "Note:",
      reservationNote: "the reservation is only confirmed after payment at the NEIIST Desk.",
      orderNote: "the order is only confirmed after payment.",
      whereToPayLabel: "Where to pay:",
      defaultWhereToPay: (campusLocation, scheduleLink) =>
        `at the NEIIST <strong>Desk (POS)</strong> (${campusLocation}).${scheduleLink}`,
      scheduleLabel: "Check the schedule here:",
      scheduleLinkText: "NEIIST Schedule",
      deadlineLabel: "Payment deadline:",
      reservationExpiryNote:
        "If the reservation is not paid by this date, it will be automatically cancelled and the stock will be released.",
      orderExpiryNote: "If not paid by this date, the order will be automatically cancelled.",
      pickupCampusLabel: "Pickup campus:",
      paymentText: {
        cash: (loc, link) => `Cash at the NEIIST Desk (${loc}).${link}`,
        mbway: () => "MB Way (waiting for confirmation in the app).",
        other: () => "Bank transfer/Other (register the reference at the desk).",
        "sumup-tpa": () => "Card at the SumUp POS terminal (confirm on the device).",
        sumup: () => "Online card via SumUp.",
        "apple-pay": () => "Apple Pay via SumUp.",
      },
    },
    paid: {
      title: "Payment Confirmed",
      intro: (orderNumber) =>
        `Payment for your order <strong>${orderNumber}</strong> has been successfully confirmed.`,
      pickupCampusLabel: "Pickup campus:",
      paymentMethodLabel: "Payment method:",
      paymentReferenceLabel: "Payment reference:",
      pickupDeadlineLabel: "Pickup deadline:",
      readyNotice: "You will receive another email when your order is ready for pickup.",
      counterText: (loc) => `NEIIST Desk or ${loc}.`,
      methods: {
        mbway: "MB Way",
        "sumup-tpa": "Card via SumUp Terminal",
        sumup: "Online card via SumUp",
        "apple-pay": "Apple Pay via SumUp",
      },
    },
    ticketPaid: {
      defaultTitle: "Event Ticket",
      titlePrefix: "Payment Confirmed",
      intro: (orderNumber, eventTitle) =>
        `We have successfully received your payment for reservation <strong>${orderNumber}</strong> for the event <strong>${eventTitle}</strong>.`,
      selectedCampusLabel: "Selected campus:",
      paymentReferenceLabel: "Payment reference:",
      issuedTitle: "Your digital ticket has been generated and issued!",
      issuedSubtitle:
        "You will receive a separate email with the official QR Code and calendar invite (.ics), or you can view your digital pass in your personal area.",
      ctaLabel: "View My Tickets",
    },
    ticketPending: {
      title: "Event Ticket - Pending Reservation",
      intro: (orderNumber) =>
        `Your reservation for the event ticket (${orderNumber}) has been successfully registered.`,
      paymentLabel: "Payment:",
      paymentLocation: (loc) => `at the NEIIST <strong>Desk (POS)</strong> (${loc}).`,
      deadlineLabel: "Deadline:",
      deadlineNote: "After this deadline, the reservation automatically expires to release spots.",
      selectedCampusLabel: "Selected campus:",
    },
    statusUpdate: {
      title: "Order Status Update",
      orderNumberLabel: "Order number:",
      currentStatusLabel: "Current status:",
      pickupDeadlineLabel: "Pickup deadline:",
      pickupDeadlineNote: "Please pick up your order at the NEIIST office by this date.",
      defaultMessage: (label) => `Your order status has been updated to: ${label}`,
      messages: {
        paid: "Your order status has been updated to paid.",
        ready: "Your order is ready for pickup!",
        delivered: "Your order has been delivered successfully!",
        cancelled: "Your order was cancelled by the shop team.",
      },
      readyAtLocation: (loc) =>
        `Your order is ready for pickup at <strong>${loc}</strong>. Check our social media for opening hours!`,
      readyFallback:
        "Your order is ready for pickup at the selected campus. Check our social media for opening hours!",
    },
    autoCancelled: {
      title: "Order Automatically Cancelled",
      intro: (orderNumber) =>
        `Your order <strong>${orderNumber}</strong> was automatically cancelled because payment was not received within the deadline.`,
      reorderNote: "If you still want the products, you can place a new order on the website.",
      selectedCampusLabel: "Selected campus:",
    },
  },
};

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
}

function renderTermsFooterNotice(locale: Locale, anchor: "withdrawal" | "events"): string {
  const copy = SHOP_EMAIL_COPY[locale];
  const termsUrl = `${getBaseUrl()}/${locale}/terms#${anchor}`;
  const linkHtml = `<a href="${termsUrl}" target="_blank" rel="noopener noreferrer" style="color: #2863FD; text-decoration: underline;">${copy.termsLinkLabel}</a>`;

  const body =
    anchor === "withdrawal"
      ? `<strong>${copy.withdrawalTitle}</strong> ${copy.withdrawalBodyBefore} <a href="mailto:neiist@tecnico.ulisboa.pt" style="color: #2863FD; text-decoration: underline;">neiist@tecnico.ulisboa.pt</a> ${copy.withdrawalBodyAfter} ${linkHtml}.`
      : `<strong>${copy.ticketTermsTitle}</strong> ${copy.ticketTermsBody} ${linkHtml}.`;

  return `
    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.9rem; color: #475569;">
      <p style="margin: 0;">${body}</p>
    </div>
  `;
}

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

export function formatPaymentDeadline(
  paymentDeadline?: string | null,
  locale: Locale = "pt"
): string {
  const copy = SHOP_EMAIL_COPY[locale];
  if (!paymentDeadline) return copy.paymentDeadlineFallback;

  const dt = new Date(paymentDeadline);
  if (Number.isNaN(dt.getTime())) return copy.paymentDeadlineFallback;

  return dt.toLocaleString(copy.dateLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPickupDeadline(
  pickupDeadline?: string | Date | null,
  locale: Locale = "pt"
): string | null {
  if (!pickupDeadline) return null;
  const dt = typeof pickupDeadline === "string" ? new Date(pickupDeadline) : pickupDeadline;
  if (Number.isNaN(dt.getTime())) return null;

  return dt.toLocaleDateString(SHOP_EMAIL_COPY[locale].dateLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function renderItemsTable(
  items: OrderEmailItem[],
  total: number,
  locale: Locale = "pt"
): string {
  const copy = SHOP_EMAIL_COPY[locale];
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
    <h3 style="color: #2863FD; margin-top: 2rem;">${copy.summaryTitle}</h3>
    <table style="width: 100%; margin: 1rem 0; border-collapse: collapse;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #dee2e6;">${copy.colProduct}</th>
          <th style="padding: 0.5rem; text-align: center; border-bottom: 2px solid #dee2e6;">${copy.colQty}</th>
          <th style="padding: 0.5rem; text-align: right; border-bottom: 2px solid #dee2e6;">${copy.colPrice}</th>
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
  customerName: string | null | undefined,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: PaymentMethod,
  paymentDeadline?: string | null,
  orderId?: number,
  locale: Locale = "pt"
): string {
  const copy = SHOP_EMAIL_COPY[locale];
  const p = copy.pending;
  const greetingName = customerName?.trim() || copy.defaultCustomer;
  const scheduleLink = orderId
    ? ` ${p.scheduleLabel} <a href="${getBaseUrl()}/${locale}/my-orders?orderId=${orderId}" target="_blank" rel="noopener noreferrer" style="color: #2863FD; text-decoration: underline;">${p.scheduleLinkText}</a>`
    : "";

  const campusLocation = getCampusLocation(campus, locale);
  const deadlineText = formatPaymentDeadline(paymentDeadline, locale);
  const isReservation = !paymentMethod;

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">${isReservation ? p.reservationTitle : p.orderTitle}</h2>
    <p style="font-size: 1.1rem;">${copy.greeting(greetingName)}</p>
    <p>${isReservation ? p.reservationIntro(orderNumber) : p.orderIntro(orderNumber)}</p>
    <p><strong>${p.noteLabel}</strong> ${isReservation ? p.reservationNote : p.orderNote}</p>
    <p><strong>${p.whereToPayLabel}</strong> ${
      paymentMethod
        ? p.paymentText[paymentMethod](campusLocation, scheduleLink)
        : p.defaultWhereToPay(campusLocation, scheduleLink)
    }</p>
    <p><strong>${p.deadlineLabel}</strong> ${deadlineText}. ${
      isReservation ? p.reservationExpiryNote : p.orderExpiryNote
    }</p>

    ${renderItemsTable(items, total, locale)}

    ${campus ? `<p><strong>${p.pickupCampusLabel}</strong> ${formatCampus(campus)}</p>` : ""}

    ${renderTermsFooterNotice(locale, "withdrawal")}
  `;

  return renderBaseEmailLayout({ content });
}

export function getOrderPaidTemplate(
  orderNumber: string,
  customerName: string | null | undefined,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: PaymentMethod,
  paymentReference?: string,
  pickupDeadline?: string | null,
  locale: Locale = "pt"
): string {
  const copy = SHOP_EMAIL_COPY[locale];
  const p = copy.paid;
  const greetingName = customerName?.trim() || copy.defaultCustomer;
  const counterText = p.counterText(getCampusLocation(campus, locale));
  const paymentMethodText = paymentMethod
    ? paymentMethod === "cash" || paymentMethod === "other"
      ? counterText
      : p.methods[paymentMethod]
    : undefined;
  const formattedPickup = formatPickupDeadline(pickupDeadline, locale);

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">${p.title}</h2>
    <p style="font-size: 1.1rem;">${copy.greeting(greetingName)}</p>
    <p>${p.intro(orderNumber)}</p>

    ${renderItemsTable(items, total, locale)}

    ${campus ? `<p><strong>${p.pickupCampusLabel}</strong> ${formatCampus(campus)}</p>` : ""}
    ${paymentMethodText ? `<p><strong>${p.paymentMethodLabel}</strong> ${paymentMethodText}</p>` : ""}
    ${paymentReference ? `<p><strong>${p.paymentReferenceLabel}</strong> ${paymentReference}</p>` : ""}
    ${formattedPickup ? `<p><strong>${p.pickupDeadlineLabel}</strong> ${formattedPickup}</p>` : ""}

    <p style="margin-top: 1.25rem;">${p.readyNotice}</p>

    ${renderTermsFooterNotice(locale, "withdrawal")}
  `;

  return renderBaseEmailLayout({ content });
}

export function getEventTicketPaidTemplate(
  orderNumber: string,
  customerName: string | null | undefined,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentReference?: string,
  locale: Locale = "pt"
): string {
  const copy = SHOP_EMAIL_COPY[locale];
  const tp = copy.ticketPaid;
  const greetingName = customerName?.trim() || copy.defaultCustomer;
  const ticketItem =
    items.find(
      (i) => (i as { product_type?: string }).product_type === "event_ticket" || i.event_id
    ) || items[0];
  const eventTitle = ticketItem?.product_name || tp.defaultTitle;

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">${tp.titlePrefix} - ${eventTitle}</h2>
    <p style="font-size: 1.1rem;">${copy.greeting(greetingName)}</p>
    <p>${tp.intro(orderNumber, eventTitle)}</p>

    ${renderItemsTable(items, total, locale)}

    ${campus ? `<p><strong>${tp.selectedCampusLabel}</strong> ${formatCampus(campus)}</p>` : ""}
    ${paymentReference ? `<p><strong>${tp.paymentReferenceLabel}</strong> ${paymentReference}</p>` : ""}

    <div style="background: #ffffff; border-radius: 0.75rem; padding: 1.25rem; margin: 1.5rem 0; border-left: 4px solid #2863FD;">
      <p style="margin: 0; font-weight: bold; color: #1e293b;">${tp.issuedTitle}</p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #64748b;">
        ${tp.issuedSubtitle}
      </p>
    </div>

    <div style="text-align: center; margin-top: 1.5rem;">
      <a href="${getBaseUrl()}/${locale}/my-tickets" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2863FD; color: #ffffff; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold;">
        ${tp.ctaLabel}
      </a>
    </div>

    ${renderTermsFooterNotice(locale, "events")}
  `;

  return renderBaseEmailLayout({ content });
}

export function getEventTicketPendingTemplate(
  orderNumber: string,
  customerName: string | null | undefined,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentDeadline?: string | null,
  _paymentMethod?: PaymentMethod,
  _orderId?: number,
  locale: Locale = "pt"
): string {
  const copy = SHOP_EMAIL_COPY[locale];
  const tp = copy.ticketPending;
  const greetingName = customerName?.trim() || copy.defaultCustomer;
  const deadlineText = formatPaymentDeadline(paymentDeadline, locale);
  const campusLocation = getCampusLocation(campus, locale);

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">${tp.title}</h2>
    <p style="font-size: 1.1rem;">${copy.greeting(greetingName)}</p>
    <p>${tp.intro(orderNumber)}</p>
    <p>
      <strong>${tp.paymentLabel}</strong> ${tp.paymentLocation(campusLocation)}
    </p>
    <p><strong>${tp.deadlineLabel}</strong> ${deadlineText}. ${tp.deadlineNote}</p>

    ${renderItemsTable(items, total, locale)}

    ${campus ? `<p><strong>${tp.selectedCampusLabel}</strong> ${formatCampus(campus)}</p>` : ""}

    ${renderTermsFooterNotice(locale, "events")}
  `;

  return renderBaseEmailLayout({ content });
}

export function getStatusUpdateOrderEmailTemplate(
  orderNumber: string,
  customerName: string | null | undefined,
  status: string,
  statusLabel: string,
  campus?: string,
  pickupDeadline?: string | null,
  locale: Locale = "pt"
): string {
  const copy = SHOP_EMAIL_COPY[locale];
  const su = copy.statusUpdate;
  const greetingName = customerName?.trim() || copy.defaultCustomer;
  const message = su.messages[status] || su.defaultMessage(statusLabel);

  const campusLocation = getCampusLocation(campus, locale);
  const formattedPickup =
    status !== "delivered" && status !== "cancelled"
      ? formatPickupDeadline(pickupDeadline, locale)
      : null;

  const pickupNotice = formattedPickup
    ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 0.5rem; margin: 1.25rem 0;">
      <p style="margin: 0; color: #92400e; font-weight: bold;">
        ${su.pickupDeadlineLabel} ${formattedPickup}
      </p>
      <p style="margin: 0.25rem 0 0 0; color: #b45309; font-size: 0.9rem;">
        ${su.pickupDeadlineNote}
      </p>
    </div>
    `
    : "";

  const readyParagraph =
    status === "ready"
      ? `<p>${campusLocation ? su.readyAtLocation(campusLocation) : su.readyFallback}</p>`
      : "";

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">${su.title}</h2>
    <p style="font-size: 1.1rem;">${copy.greeting(greetingName)}</p>
    <p>${message}</p>
    <p><strong>${su.orderNumberLabel}</strong> ${orderNumber}</p>
    <p><strong>${su.currentStatusLabel}</strong> ${statusLabel}</p>

    ${pickupNotice}

    ${readyParagraph}
  `;

  return renderBaseEmailLayout({ content });
}

export function getAutoCancelledOrderEmailTemplate(
  orderNumber: string,
  customerName: string | null | undefined,
  campus?: string,
  locale: Locale = "pt"
): string {
  const copy = SHOP_EMAIL_COPY[locale];
  const ac = copy.autoCancelled;
  const greetingName = customerName?.trim() || copy.defaultCustomer;

  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">${ac.title}</h2>
    <p style="font-size: 1.1rem;">${copy.greeting(greetingName)}</p>
    <p>${ac.intro(orderNumber)}</p>
    <p>${ac.reorderNote}</p>
    ${campus ? `<p><strong>${ac.selectedCampusLabel}</strong> ${formatCampus(campus)}</p>` : ""}
  `;

  return renderBaseEmailLayout({ content });
}

export function getPendingOrderEmailTemplate(
  orderNumber: string,
  customerName: string | null | undefined,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: PaymentMethod,
  paymentDeadline?: string | null,
  orderId?: number,
  isTicket?: boolean,
  locale: Locale = "pt"
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
      orderId,
      locale
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
    orderId,
    locale
  );
}

export function getPaidOrderEmailTemplate(
  orderNumber: string,
  customerName: string | null | undefined,
  items: OrderEmailItem[],
  total: number,
  campus?: string,
  paymentMethod?: PaymentMethod,
  paymentReference?: string,
  isTicket?: boolean,
  pickupDeadline?: string | null,
  locale: Locale = "pt"
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
      paymentReference,
      locale
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
    pickupDeadline,
    locale
  );
}
