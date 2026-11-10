import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { isPaymentMethod, isPaymentMethodAllowedForChannel } from "@/types/shop/payment";
import { generateOrderNumber } from "@/lib/db/repositories/shop.repository";
import { CheckoutSessionData } from "@/types/redis";
import { reserveStockHolds, toStockRequests } from "@/lib/redis/holds";
import { saveCheckoutSession } from "@/lib/redis/sessions";
import { handleApiError } from "@/utils/apiErrorUtils";
import { validateAndPriceCartItems } from "@/utils/shop/orderFinalization";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedUser();
    const user = session?.user;
    if (!user) return NextResponse.json({ error: "Tens de ter sessão iniciada." }, { status: 401 });

    const body = await req.json();

    if (!Array.isArray(body.items) || body.items.length === 0)
      return NextResponse.json({ error: "O carrinho está vazio." }, { status: 400 });

    const itemsInput: Array<{
      product_id: number;
      variant_id?: number | null;
      quantity?: number;
      deliver_now?: boolean;
    }> = body.items;

    if (
      !isPaymentMethod(body.payment_method) ||
      !isPaymentMethodAllowedForChannel("web", body.payment_method)
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
    const orderNumber = await generateOrderNumber();
    const { reqs, pgStocks } = toStockRequests(itemsInput, pricing.productsMap);
    if (reqs.length > 0) {
      const held = await reserveStockHolds(orderNumber, reqs, pgStocks, 1800);
      if (!held) {
        return NextResponse.json(
          { error: "Stock insuficiente para um ou mais artigos selecionados." },
          { status: 409 }
        );
      }
    }

    // Save ephemeral checkout session in Redis (TTL = 30m / 1800s)
    const expiresAt = new Date(Date.now() + 1800 * 1000).toISOString();
    const sessionData: CheckoutSessionData = {
      order_number: orderNumber,
      order_source: "web",
      total_amount: finalTotal,
      payment_method: body.payment_method,
      items: itemsInput.map((it) => ({
        product_id: it.product_id,
        variant_id: it.variant_id ?? null,
        quantity: it.quantity ?? 1,
        deliver_now: false,
      })),
      user_istid: sessionUserIstid,
      customer_name: body.customer_name || user.name || null,
      customer_email: body.customer_email || user.email || null,
      customer_phone: body.customer_phone || null,
      customer_nif: body.customer_nif || null,
      campus: body.campus || null,
      notes: body.notes || null,
      discount_code: discountCode || null,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    };

    await saveCheckoutSession(sessionData, 1800);

    return NextResponse.json({
      orderNumber,
      totalAmount: finalTotal,
      expiresAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
