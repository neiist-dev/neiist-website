import { NextRequest, NextResponse } from "next/server";
import {
  isPaymentMethod,
  isPaymentMethodAllowedForChannel,
  PaymentMethod,
} from "@/types/shop/payment";
import { Order, OrderSource, CreateOrderItemInput, CreateOrderInput } from "@/types/shop/order";
import { Product } from "@/types/shop/product";
import { User } from "@/types/user";
import { handleApiError } from "@/utils/apiErrorUtils";
import {
  createOrder,
  getProduct,
  getOrderByNumber,
  generateOrderNumber,
} from "@/lib/db/repositories/shop.repository";
import { getUser, updateUser } from "@/lib/db/repositories/user.repository";
import { getShiftById, getActiveShiftForStation } from "@/lib/db/repositories/pos.repository";
import { getCartIdOrderNumber, setCartIdOrderNumber } from "@/lib/redis/sessions";
import { withStock } from "@/lib/redis/holds";
import {
  enqueueEventTicketHooks,
  sendOrderPaidEmails,
  buildOrderPaymentInput,
  schedulePendingOrderExpiry,
  sendPendingOrderEmail,
} from "@/utils/shop/orderFinalization";
import { verifyPermission } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { revalidatePath } from "next/cache";

interface OrderItemPayload {
  product_id: number;
  variant_id?: number | null;
  quantity?: number;
  deliver_now?: boolean;
}

interface OrderRequestBody {
  order_source?: string;
  cart_id?: string;
  items?: OrderItemPayload[];
  guest_checkout?: boolean;
  is_reservation?: boolean;
  payment_method?: string;
  payment?: {
    method?: string;
    shift_id?: string | null;
    reference?: string;
  };
  payment_reference?: string;
  user_istid?: string;
  shift_id?: string | null;
  station_id?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_nif?: string | null;
  campus?: string | null;
  notes?: string | null;
  discount_code?: string;
  stock_override?: boolean;
  order_number?: string;
}

function parseOrderSource(value?: string): OrderSource {
  if (value === "pos" || value === "fast-pos") return value;
  return "web";
}

function extractPaymentMethod(
  body: OrderRequestBody,
  isReservation: boolean
): PaymentMethod | undefined {
  if (isReservation) return undefined;
  if (typeof body.payment_method === "string" && isPaymentMethod(body.payment_method))
    return body.payment_method;

  if (typeof body.payment?.method === "string" && isPaymentMethod(body.payment.method))
    return body.payment.method;

  return undefined;
}

async function resolveShiftId(
  isPos: boolean,
  shiftId?: string | null,
  stationId?: string | null
): Promise<string | null> {
  let resolved = shiftId ?? null;
  if (resolved) {
    const shift = await getShiftById(resolved);
    if (!shift || shift.status !== "open") resolved = null;
  }
  if (isPos && !resolved && stationId) {
    const active = await getActiveShiftForStation(stationId);
    if (active) resolved = active.id;
  }
  return resolved;
}

function validateProductRules(
  products: Product[],
  items: Array<{ quantity?: number }>,
  orderSource: OrderSource,
  orderUserIstid?: string
): string | null {
  const isFastPos = orderSource === "fast-pos";

  if (products.some((p) => !p.channels?.includes(orderSource)))
    return "Não é permitida a encomenda de produtos fora do canal selecionado";

  if (isFastPos && products.some((p) => p.stock_type !== "untracked"))
    return "Apenas produtos com stock untracked podem ser vendidos no balcão rápido";

  const hasTickets = products.some((p) => p.product_type === "event_ticket");
  const hasMerchandise = products.some((p) => p.product_type === "merchandise");
  const hasFoodDrink = products.some((p) => p.product_type === "food_drink");

  if (hasTickets && (hasMerchandise || hasFoodDrink)) {
    return "Bilhetes de eventos não podem ser encomendados juntamente com outros produtos";
  }

  if (hasFoodDrink && !isFastPos) return "Produtos alimentares apenas disponíveis no balcão rápido";

  if (hasTickets) {
    if (!orderUserIstid) return "A compra de bilhetes requer a identificação do estudante (IST ID)";

    const totalTickets = items.reduce((sum, it) => sum + (it.quantity ?? 1), 0);
    if (totalTickets > 1) return "Apenas é permitido 1 bilhete por utilizador";
  }

  return null;
}

function validateOrderContext(body: OrderRequestBody, user: User): NextResponse | null {
  const orderSource = parseOrderSource(body.order_source);
  const isFastPos = orderSource === "fast-pos";
  const isPos = orderSource === "pos" || isFastPos;

  const canAccessPos = hasPermission(user, "pos:access");
  const canOverride = hasPermission(user, "orders:override");
  const canWriteUsers = hasPermission(user, "users:write");

  if (isPos && !canAccessPos)
    return NextResponse.json({ error: "Sem permissão de acesso ao terminal POS" }, { status: 403 });

  if (!Array.isArray(body.items) || body.items.length === 0)
    return NextResponse.json({ error: "No items in order" }, { status: 400 });

  const guestCheckout = body.guest_checkout === true;
  if (guestCheckout && (!isPos || !canWriteUsers || !canOverride))
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

  const isReservation = body.is_reservation === true;
  if (orderSource === "web" && !isReservation)
    return NextResponse.json(
      { error: "Pagamentos online devem iniciar sessão de checkout." },
      { status: 400 }
    );

  if (isReservation) {
    if (isFastPos) {
      return NextResponse.json(
        { error: "Não são permitidas reservas no balcão rápido" },
        { status: 400 }
      );
    }
    if (isPos && (!canAccessPos || !canOverride)) {
      return NextResponse.json(
        {
          error:
            "Apenas operadores com permissão orders:override podem criar reservas no balcão POS",
        },
        { status: 403 }
      );
    }
  }

  if (!isReservation) {
    const explicitMethod = extractPaymentMethod(body, false);
    if (!explicitMethod)
      return NextResponse.json({ error: "Método de pagamento obrigatório" }, { status: 400 });

    if (!isPaymentMethodAllowedForChannel(orderSource, explicitMethod)) {
      return NextResponse.json(
        { error: "Método de pagamento inválido para este canal" },
        { status: 400 }
      );
    }
  }

  return null;
}

async function checkFastPosIdempotency(body: OrderRequestBody): Promise<Order | null> {
  const orderSource = parseOrderSource(body.order_source);
  if (orderSource === "fast-pos" && typeof body.cart_id === "string" && body.cart_id.trim()) {
    const existingOrderNumber = await getCartIdOrderNumber(body.cart_id.trim());
    if (existingOrderNumber) return (await getOrderByNumber(existingOrderNumber)) ?? null;
  }
  return null;
}

async function resolveAndValidateProducts(
  body: OrderRequestBody,
  userIstid: string
): Promise<
  { productsMap: Map<number, Product>; orderUserIstid?: string } | { error: NextResponse }
> {
  const items = body.items || [];
  const productIds = Array.from(new Set(items.map((it) => it.product_id)));
  const fetchedProducts = await Promise.all(productIds.map((id) => getProduct(id)));

  if (fetchedProducts.some((p) => p == null))
    return { error: NextResponse.json({ error: "Produto inválido no pedido" }, { status: 400 }) };

  const products = fetchedProducts as Product[];
  const orderSource = parseOrderSource(body.order_source);
  const isPos = orderSource === "pos" || orderSource === "fast-pos";
  const guestCheckout = body.guest_checkout === true;
  const orderUserIstid = guestCheckout
    ? undefined
    : isPos
      ? body.user_istid || userIstid
      : userIstid;

  const ruleError = validateProductRules(products, items, orderSource, orderUserIstid);
  if (ruleError) return { error: NextResponse.json({ error: ruleError }, { status: 400 }) };

  return {
    productsMap: new Map<number, Product>(products.map((p) => [p.id, p])),
    orderUserIstid,
  };
}

async function resolveOrderShift(
  body: OrderRequestBody,
  orderSource: OrderSource,
  paymentMethod: PaymentMethod | undefined
): Promise<{ shiftId: string | null } | { error: NextResponse }> {
  const isPos = orderSource === "pos" || orderSource === "fast-pos";
  const resolvedShiftId = await resolveShiftId(
    isPos,
    body.shift_id ?? body.payment?.shift_id,
    body.station_id
  );

  const requiresCounterShift = isPos && (paymentMethod === "cash" || paymentMethod === "sumup-tpa");
  if (requiresCounterShift && !resolvedShiftId)
    return {
      error: NextResponse.json(
        { error: "Turno de caixa ativo obrigatório para efetuar vendas ao balcão." },
        { status: 400 }
      ),
    };

  return { shiftId: resolvedShiftId };
}

async function handlePostOrderSideEffects(
  order: Order,
  paymentPayload: ReturnType<typeof buildOrderPaymentInput>,
  paymentMethod: PaymentMethod | undefined,
  orderUserIstid?: string,
  customerPhone?: string,
  cartId?: string
) {
  if (!paymentPayload) await schedulePendingOrderExpiry(order);

  if (cartId && typeof cartId === "string" && cartId.trim())
    await setCartIdOrderNumber(cartId.trim(), order.order_number);

  if (orderUserIstid && customerPhone) {
    const targetUser = await getUser(orderUserIstid);
    if (targetUser && targetUser.phone !== customerPhone)
      await updateUser(orderUserIstid, { phone: customerPhone });
  }

  if (orderUserIstid && paymentPayload?.status === "successful")
    await enqueueEventTicketHooks(order);

  if (paymentPayload?.status === "successful") {
    sendOrderPaidEmails(order, paymentPayload.reference ?? undefined);
  } else {
    await sendPendingOrderEmail(order, paymentMethod);
  }
}

async function executeOrderCreation(params: {
  body: OrderRequestBody;
  user: User;
  orderSource: OrderSource;
  productsMap: Map<number, Product>;
  orderUserIstid?: string;
  paymentMethod?: PaymentMethod;
  resolvedShiftId: string | null;
  canOverride: boolean;
}): Promise<Order | null> {
  const {
    body,
    user,
    orderSource,
    productsMap,
    orderUserIstid,
    paymentMethod,
    resolvedShiftId,
    canOverride,
  } = params;
  const isFastPos = orderSource === "fast-pos";
  const isPos = orderSource === "pos" || isFastPos;
  const guestCheckout = body.guest_checkout === true;

  const customerName = String(body.customer_name ?? "").trim();
  const customerEmail = typeof body.customer_email === "string" ? body.customer_email.trim() : "";
  const customerPhone = typeof body.customer_phone === "string" ? body.customer_phone.trim() : "";
  const stockOverride = canOverride && body.stock_override === true;

  const orderItemsInput: CreateOrderItemInput[] = (body.items || []).map((it) => ({
    product_id: it.product_id,
    variant_id: it.variant_id ?? null,
    quantity: it.quantity ?? 1,
    deliver_now: isFastPos ? true : Boolean(it.deliver_now),
  }));

  const paymentPayload = paymentMethod
    ? buildOrderPaymentInput({
        method: paymentMethod,
        status: "successful",
        shiftId: resolvedShiftId,
        receivedBy: isPos ? user.istid : null,
        reference: body.payment?.reference ?? body.payment_reference,
      })
    : undefined;

  const orderNumber =
    isPos && typeof body.order_number === "string" && body.order_number.trim()
      ? body.order_number.trim()
      : await generateOrderNumber();

  const orderInput: CreateOrderInput = {
    order_number: orderNumber,
    order_source: orderSource,
    user_istid: orderUserIstid,
    customer_name: isFastPos
      ? customerName || "Cliente Balcão Rápido"
      : customerName || (guestCheckout ? "Cliente POS" : ""),
    customer_email: isFastPos ? null : customerEmail || null,
    customer_phone: isFastPos ? null : customerPhone || null,
    customer_nif: body.customer_nif ?? null,
    campus: body.campus ?? null,
    notes: body.notes ?? null,
    payment: paymentPayload,
    created_by: user.istid,
    items: orderItemsInput,
    discount_code: typeof body.discount_code === "string" ? body.discount_code : undefined,
    stock_override: stockOverride,
  };

  const order = stockOverride
    ? await createOrder(orderInput)
    : await withStock(orderNumber, orderItemsInput, productsMap, 30, () => createOrder(orderInput));

  if (!order) return null;

  await handlePostOrderSideEffects(
    order,
    paymentPayload,
    paymentMethod,
    orderUserIstid,
    customerPhone,
    isFastPos ? body.cart_id : undefined
  );

  return order;
}

export async function POST(request: NextRequest) {
  const auth = await verifyPermission("orders:create");
  if (auth.error) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as OrderRequestBody | null;
  if (!body) return NextResponse.json({ error: "Corpo do pedido inválido" }, { status: 400 });

  const existingOrder = await checkFastPosIdempotency(body);
  if (existingOrder) return NextResponse.json(existingOrder);

  const contextError = validateOrderContext(body, user);
  if (contextError) return contextError;

  const productResult = await resolveAndValidateProducts(body, user.istid);
  if ("error" in productResult) return productResult.error;

  const orderSource = parseOrderSource(body.order_source);
  const paymentMethod = extractPaymentMethod(body, body.is_reservation === true);

  const shiftResult = await resolveOrderShift(body, orderSource, paymentMethod);
  if ("error" in shiftResult) return shiftResult.error;

  try {
    const order = await executeOrderCreation({
      body,
      user,
      orderSource,
      productsMap: productResult.productsMap,
      orderUserIstid: productResult.orderUserIstid,
      paymentMethod,
      resolvedShiftId: shiftResult.shiftId,
      canOverride: hasPermission(user, "orders:override"),
    });

    if (!order) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });

    revalidatePath("/orders");
    revalidatePath("/my-orders");
    return NextResponse.json(order);
  } catch (error) {
    return handleApiError(error);
  }
}
