import { NextRequest, NextResponse } from "next/server";
import {
  getAllOrders,
  newOrder,
  getUser,
  updateUser,
  mapOrderDbErrorToResponse,
  getProduct,
} from "@/utils/dbUtils";
import { UserRole } from "@/types/user";
import { PAYMENT_METHODS, PENDING_PAYMENT_METHODS, PaymentMethod } from "@/types/shop/payment";
import { OrderSource } from "@/types/shop/orderKind";
import { getOrderKindRules, getOrderKindFromItems } from "@/utils/shop/orderKindUtils";
import { OrderItem } from "@/types/shop/order";
import { Product } from "@/types/shop/product";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { sendEmail, getPendingOrderEmailTemplate } from "@/utils/emailUtils";

function parseOrderSource(value: string): OrderSource {
  switch (value) {
    case "dinner":
    case "pos":
    case "mobile-pos":
      return value;
    default:
      return "other";
  }
}

export async function GET() {
  const userRoles = await serverCheckRoles([
    UserRole._SHOP_MANAGER,
    UserRole._COORDINATOR,
    UserRole._ADMIN,
  ]);

  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const body = await request.json();
    const validPaymentMethods = new Set(Object.keys(PAYMENT_METHODS));
    const orderSource = parseOrderSource(body.order_source);

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    const hasExplicitPaymentMethod =
      typeof body.payment_method === "string" && validPaymentMethods.has(body.payment_method);
    const explicitlyRequestedMethod = hasExplicitPaymentMethod
      ? (body.payment_method as PaymentMethod)
      : undefined;

    const orderItems = new Set<number>(body.items.map((item: OrderItem) => item.product_id));
    const products = await Promise.all([...orderItems].map((id) => getProduct(id)));
    if (products.some((product) => product == null))
      return NextResponse.json({ error: "Produto invalido no pedido" }, { status: 400 });

    const { orderKind, isMixedInvalid } = getOrderKindFromItems(products as Product[]);
    const orderRules = getOrderKindRules(orderKind, orderSource);

    if (isMixedInvalid) {
      return NextResponse.json(
        { error: "Este pedido nao pode misturar categorias especiais com outras categorias" },
        { status: 400 }
      );
    }

    if (!orderRules.allowedSources.includes(orderSource)) {
      return NextResponse.json(
        { error: "Não é permitida a encomenda de produtos desta categoria" },
        { status: 400 }
      );
    }

    const allowedPaymentMethods = orderRules.paymentMethods;
    const paymentMethod: PaymentMethod =
      explicitlyRequestedMethod ??
      (allowedPaymentMethods.length > 0 ? allowedPaymentMethods[0] : "in-person");

    if (allowedPaymentMethods.length > 0 && !allowedPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Metodo de pagamento invalido para a categoria selecionada" },
        { status: 400 }
      );
    }

    const userAssignmentRequired = orderRules.requiresUserAssignment;

    if (userAssignmentRequired && !body.user_istid) {
      return NextResponse.json(
        { error: "Utilizador obrigatorio para este tipo de pedido" },
        { status: 400 }
      );
    }

    const stockOverride =
      (userRoles.roles?.includes(UserRole._ADMIN) ?? false) && body.stock_override === true;

    const order = await newOrder(
      {
        user_istid: userAssignmentRequired ? body.user_istid : undefined,
        customer_name:
          body.customer_name ?? (userAssignmentRequired ? "" : "Cliente POS - Churrasco"),
        customer_email: userAssignmentRequired ? (body.customer_email ?? null) : null,
        customer_phone: body.customer_phone ?? null,
        customer_nif: body.customer_nif ?? null,
        campus: body.campus ?? null,
        notes: body.notes ?? null,
        payment_method: paymentMethod,
        payment_reference: body.payment_reference ?? "",
        created_by: userRoles.user!.istid,
        items: body.items,
      },
      stockOverride
    );
    if (!order) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });

    if (userAssignmentRequired && body.customer_phone && body.user_istid) {
      const user = await getUser(body.user_istid);
      if (user && user.phone !== body.customer_phone)
        await updateUser(body.user_istid, { phone: body.customer_phone });
    }

    if (
      hasExplicitPaymentMethod &&
      order.customer_email &&
      orderRules.customerEmailsEnabled &&
      PENDING_PAYMENT_METHODS.has(paymentMethod)
    ) {
      try {
        await sendEmail({
          to: order.customer_email,
          subject: `Encomenda ${order.order_number} - Pendente`,
          html: getPendingOrderEmailTemplate(
            orderKind,
            order.order_number,
            order.customer_name,
            order.items,
            order.total_amount,
            order.campus ?? undefined,
            order.payment_method ?? undefined,
            order.pickup_deadline ?? null
          ),
        });
      } catch (emailErr) {
        console.warn("Failed to send order confirmation email:", emailErr);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    const mappedError = mapOrderDbErrorToResponse(error);
    if (mappedError)
      return NextResponse.json({ error: mappedError.error }, { status: mappedError.status });

    console.error("orders POST error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
