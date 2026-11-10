import { NextRequest, NextResponse } from "next/server";
import { verifyPermission } from "@/lib/auth";
import { getAllOrdersNoCache } from "@/lib/db/repositories/shop.repository";
import * as XLSX from "xlsx";
import { getStatusLabel, isTicketOrder } from "@/utils/shop/orderStatusUtils";
import { getColorFromOptions, formatVariantSimple } from "@/utils/shop/shopUtils";
import { withSumUp } from "@/lib/payments/sumup";
import { getDictionary } from "@/i18n/dictionaries";
import { handleApiError } from "@/utils/apiErrorUtils";
import { Order } from "@/types/shop/order";

const merchantCode = process.env.SUMUP_MERCHANT_CODE;
const apiKey = process.env.SUMUP_API_KEY;

interface EnrichedPaymentRow {
  "Número da Encomenda": string;
  Data: string;
  Tipo: string;
  "ID da Transação": string;
  "Modo de Pagamento": string;
  "Tipo de Cartão": string;
  "Últimos 4 Dígitos": string;
  "Processar Como": string;
  "Modo de Entrada": string;
  Moeda: string;
  "Preço (Bruto) (€)": number;
  "Taxa SumUp (€)": number;
  "Valor Líquido (€)": number;
  "Estado do Pagamento": string;
}

async function lookupSumUpPayment(reference: string | null | undefined) {
  if (!reference || !merchantCode) return null;

  const tx = await withSumUp((client) =>
    client.transactions.get(merchantCode, { transaction_code: reference })
  ).catch((err) => {
    console.warn(`SumUp lookup error for reference ${reference}:`, err);
    return null;
  });

  if (!tx) return null;

  return {
    transactionCode: tx.transaction_code || tx.id || reference,
    entryMode: tx.entry_mode || null,
    cardType: tx.card?.type || tx.simple_payment_type || null,
    last4: tx.card?.last_4_digits || null,
    processAs: tx.process_as || null,
    currency: tx.currency || "EUR",
    feeAmount: tx.fee_amount != null ? Number(tx.fee_amount) : null,
  };
}

async function buildOrdersWorkbook(orders: Order[]): Promise<Buffer> {
  const ordersTableDict = getDictionary("pt").orders_table;
  const ordersSheet = orders.map((o) => {
    const primaryPayment = o.payments?.[0];
    const txId = (primaryPayment?.reference || o.payment_reference || "").split(";")[0].trim();

    return {
      Estado: getStatusLabel(o.status, ordersTableDict.status, {
        isTicket: isTicketOrder(o),
        ticketConfirmedLabel: ordersTableDict.ticket_confirmed,
      }),
      Número: o.order_number,
      Data: new Date(o.created_at).toLocaleString("pt-PT"),
      Nome: o.customer_name || "",
      Email: o.customer_email || "",
      NIF: o.customer_nif || "",
      "IST ID": o.user_istid || "",
      Campus: o.campus || "",
      Telefone: o.customer_phone || "",
      "Método de Pagamento": o.payment_method || "",
      "ID Transação (Pagamento)": txId,
      "Total (€)": o.total_amount,
      Notas: o.notes || "",
      Origem: o.order_source || "web",
      Produtos: (o.items || [])
        .map((it) => {
          const { text: variantText } = formatVariantSimple(it.variant_options, it.variant_label);
          const variantSuffix = variantText ? ` (${variantText})` : "";
          return `${it.product_name}${variantSuffix} x${it.quantity} [${it.status}]`;
        })
        .join("; "),
    };
  });

  const paymentsRows: EnrichedPaymentRow[] = [];
  const lookupCache = new Map<string, Awaited<ReturnType<typeof lookupSumUpPayment>>>();

  for (const order of orders) {
    const paymentList =
      order.payments && order.payments.length > 0
        ? order.payments
        : [
            {
              id: 0,
              order_number: order.order_number,
              method: order.payment_method || "other",
              amount: order.total_amount,
              status: (order.status === "paid" ||
              order.status === "delivered" ||
              order.status === "ready"
                ? "successful"
                : "pending") as "successful" | "pending",
              reference: order.payment_reference || null,
              paid_at: order.paid_at || null,
              created_at: order.created_at,
            },
          ];

    for (const payment of paymentList) {
      const method = payment.method as string;
      const isSumUp =
        method === "sumup" ||
        method === "sumup-tpa" ||
        method === "tpa" ||
        method === "card-online" ||
        method === "apple-pay";

      let cardType = "-";
      let last4 = "-";
      let processAs = "-";
      let entryMode = "-";
      let currency = "EUR";
      let feeAmount = 0;
      let netAmount = Number(payment.amount);
      const cleanReference = (payment.reference || "").split(";")[0].trim();
      let txId = cleanReference;

      if (isSumUp && apiKey && cleanReference && payment.status === "successful") {
        let enrichment = lookupCache.get(cleanReference);
        if (enrichment === undefined) {
          enrichment = await lookupSumUpPayment(cleanReference);
          lookupCache.set(cleanReference, enrichment);
        }

        if (enrichment) {
          if (enrichment.transactionCode) txId = enrichment.transactionCode;
          if (enrichment.entryMode) entryMode = enrichment.entryMode;
          if (enrichment.cardType) cardType = enrichment.cardType;
          if (enrichment.last4) last4 = enrichment.last4;
          if (enrichment.processAs) processAs = enrichment.processAs;
          currency = enrichment.currency;
          if (enrichment.feeAmount != null) {
            feeAmount = enrichment.feeAmount;
            netAmount = Number(payment.amount) - feeAmount;
          }
        }
      }

      paymentsRows.push({
        "Número da Encomenda": order.order_number,
        Data: payment.paid_at
          ? new Date(payment.paid_at).toLocaleString("pt-PT")
          : new Date(payment.created_at).toLocaleString("pt-PT"),
        Tipo: "Venda",
        "ID da Transação": txId,
        "Modo de Pagamento": payment.method,
        "Tipo de Cartão": cardType,
        "Últimos 4 Dígitos": last4 !== "-" ? `**** ${last4}` : "-",
        "Processar Como": processAs,
        "Modo de Entrada": entryMode,
        Moeda: currency,
        "Preço (Bruto) (€)": Number(payment.amount),
        "Taxa SumUp (€)": feeAmount,
        "Valor Líquido (€)": netAmount,
        "Estado do Pagamento": payment.status,
      });
    }
  }

  const statsMapDetalhes: Record<
    string,
    { modelo: string; cor: string; tamanho: string; quantidade: number }
  > = {};
  const statsMapCampus: Record<
    string,
    { campus: string; modelo: string; cor: string; tamanho: string; quantidade: number }
  > = {};
  const statsMapCampusDate: Record<
    string,
    {
      campus: string;
      modelo: string;
      data: string;
      cor: string;
      tamanho: string;
      quantidade: number;
    }
  > = {};

  orders.forEach((order) =>
    (order.items || []).forEach((item) => {
      const modelo = item.product_name || "Desconhecido";
      const colorInfo = getColorFromOptions(item.variant_options, item.variant_label);
      const cor = colorInfo.name || "Único";
      const tamanho =
        formatVariantSimple(item.variant_options ?? undefined, item.variant_label ?? undefined)
          .text || "Único";
      const key = `${modelo}|||${cor}|||${tamanho}`;
      if (!statsMapDetalhes[key]) {
        statsMapDetalhes[key] = { modelo, cor, tamanho, quantidade: 0 };
      }
      statsMapDetalhes[key].quantidade += item.quantity;

      const campus = order.campus || "alameda";
      const ciKey = `${campus}|||${modelo}|||${cor}|||${tamanho}`;
      if (!statsMapCampus[ciKey]) {
        statsMapCampus[ciKey] = { campus, modelo, cor, tamanho, quantidade: 0 };
      }
      statsMapCampus[ciKey].quantidade += item.quantity;

      const dateStr = new Date(order.created_at).toISOString().slice(0, 10);
      const cdKey = `${campus}|||${modelo}|||${dateStr}|||${cor}|||${tamanho}`;
      if (!statsMapCampusDate[cdKey]) {
        statsMapCampusDate[cdKey] = {
          campus,
          modelo,
          data: dateStr,
          cor,
          tamanho,
          quantidade: 0,
        };
      }
      statsMapCampusDate[cdKey].quantidade += item.quantity;
    })
  );

  const statsSheet = Object.values(statsMapDetalhes).map((it) => ({
    Modelo: it.modelo,
    Cor: it.cor,
    Tamanho: it.tamanho,
    Quantidade: it.quantidade,
  }));

  const campusSheet = Object.values(statsMapCampus).map((it) => ({
    Campus: it.campus,
    Modelo: it.modelo,
    Cor: it.cor,
    Tamanho: it.tamanho,
    Quantidade: it.quantidade,
  }));

  const campusDateSheet = Object.values(statsMapCampusDate).map((it) => ({
    Campus: it.campus,
    Modelo: it.modelo,
    Data: it.data,
    Cor: it.cor,
    Tamanho: it.tamanho,
    Quantidade: it.quantidade,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ordersSheet), "Encomendas");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(paymentsRows), "Pagamentos");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(statsSheet), "Detalhes");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(campusSheet),
    "InventarioPorCampus"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(campusDateSheet),
    "InventarioPorCampusPorDia"
  );

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export async function POST(request: NextRequest) {
  const auth = await verifyPermission("orders:read_customer");
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => null);
    const allOrders = await getAllOrdersNoCache();
    const selectedOrderNumbers =
      Array.isArray(body?.orderNumbers) && body.orderNumbers.length > 0
        ? new Set(body.orderNumbers)
        : null;
    const orders = selectedOrderNumbers
      ? allOrders.filter((o) => selectedOrderNumbers.has(o.order_number))
      : allOrders;

    const buffer = await buildOrdersWorkbook(orders);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="encomendas_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
