import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { isPaymentMethod, isPaymentMethodAllowedForChannel } from "@/types/shop/payment";
import { generateOrderNumber } from "@/lib/db/repositories/shop.repository";
import { CHECKOUT_HOLD_TTL_SECONDS, CheckoutSessionData, StockRequestItem } from "@/types/redis";
import { reserveStockHolds, toStockRequests } from "@/lib/redis/holds";
import {
  discardCheckoutSession,
  getCheckoutSession,
  getRemainingSessionSeconds,
  saveCheckoutSession,
} from "@/lib/redis/sessions";
import { handleApiError } from "@/utils/apiErrorUtils";
import { validateAndPriceCartItems } from "@/utils/shop/orderFinalization";

const getItemsSignature = (items: StockRequestItem[]) =>
  items
    .map((it) => `${it.product_id}:${it.variant_id ?? 0}:${it.quantity ?? 1}`)
    .sort()
    .join("|");

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: "Tens de ter sessão iniciada." }, { status: 401 });

    const body = await req.json();
    if (!Array.isArray(body.items) || body.items.length === 0)
      return NextResponse.json({ error: "O carrinho está vazio." }, { status: 400 });

    const itemsInput: StockRequestItem[] = body.items;
    const paymentMethod = body.payment_method ?? undefined;
    if (
      paymentMethod !== undefined &&
      (!isPaymentMethod(paymentMethod) || !isPaymentMethodAllowedForChannel("web", paymentMethod))
    ) {
      return NextResponse.json({ error: "Método de pagamento inválido." }, { status: 400 });
    }

    const sessionUserIstid = user.istid || null;
    const discountCode = typeof body.discount_code === "string" ? body.discount_code.trim() : "";

    const pricing = await validateAndPriceCartItems(itemsInput, {
      channel: "web",
      enforceChannel: true,
      enforceTicketRules: true,
      discountCode,
      userIstid: sessionUserIstid,
    });
    if (!pricing.isValid) return NextResponse.json({ error: pricing.error }, { status: 400 });

    const finalTotal = pricing.finalAmount;
    const requestedOrderNumber =
      typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";

    let existing: CheckoutSessionData | null = null;
    let remainingSeconds = 0;

    if (requestedOrderNumber) {
      const found = await getCheckoutSession(requestedOrderNumber);
      if (found) {
        if (found.user_istid && found.user_istid !== sessionUserIstid)
          return NextResponse.json(
            { error: "Sem permissão para esta encomenda." },
            { status: 403 }
          );

        const left = getRemainingSessionSeconds(found);
        const sameItems = getItemsSignature(found.items) === getItemsSignature(itemsInput);
        if (left > 0 && sameItems) {
          existing = found;
          remainingSeconds = left;
        } else {
          await discardCheckoutSession(requestedOrderNumber);
        }
      }

      if (!existing && body.requireExisting === true) {
        return NextResponse.json(
          { error: "A sessão de checkout expirou. Volta ao carrinho." },
          { status: 410 }
        );
      }
    }

    const now = Date.now();
    const orderNumber = existing ? existing.order_number : await generateOrderNumber();
    const expiresAt = existing
      ? existing.expires_at
      : new Date(now + CHECKOUT_HOLD_TTL_SECONDS * 1000).toISOString();
    const ttl = existing ? remainingSeconds : CHECKOUT_HOLD_TTL_SECONDS;

    if (!existing) {
      const { reqs, pgStocks } = toStockRequests(itemsInput, pricing.productsMap);
      if (reqs.length > 0 && !(await reserveStockHolds(orderNumber, reqs, pgStocks, ttl))) {
        return NextResponse.json(
          { error: "Stock insuficiente para um ou mais artigos selecionados." },
          { status: 409 }
        );
      }
    }

    const pick = (field: string, fallback: string | null) =>
      body[field] !== undefined ? body[field] || null : fallback;

    const sessionData: CheckoutSessionData = {
      order_number: orderNumber,
      order_source: "web",
      total_amount: finalTotal,
      payment_method: paymentMethod ?? existing?.payment_method ?? null,
      items:
        existing?.items ??
        itemsInput.map((it) => ({
          product_id: it.product_id,
          variant_id: it.variant_id ?? null,
          quantity: it.quantity ?? 1,
          deliver_now: false,
        })),
      user_istid: sessionUserIstid,
      customer_name: body.customer_name || existing?.customer_name || user.name || null,
      customer_email: body.customer_email || existing?.customer_email || user.email || null,
      customer_phone: pick("customer_phone", existing?.customer_phone ?? null),
      customer_nif: pick("customer_nif", existing?.customer_nif ?? null),
      campus: pick("campus", existing?.campus ?? null),
      notes: pick("notes", existing?.notes ?? null),
      discount_code:
        body.discount_code !== undefined ? discountCode || null : (existing?.discount_code ?? null),
      created_at: existing?.created_at ?? new Date(now).toISOString(),
      expires_at: expiresAt,
    };

    await saveCheckoutSession(sessionData, ttl);

    return NextResponse.json({
      orderNumber,
      totalAmount: finalTotal,
      expiresAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
