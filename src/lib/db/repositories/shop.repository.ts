import { Category, dbCategory, mapdbCategoryToCategory } from "@/types/shop/category";
import {
  dbDiscountCode,
  DiscountCode,
  DiscountCodeInput,
  DiscountCodeUpdateInput,
  DiscountValidationResult,
  mapdbDiscountCodeToDiscountCode,
} from "@/types/shop/discountCode";
import {
  CreateOrderInput,
  dbOrder,
  dbOrderItem,
  mapdbOrderToOrder,
  mapdbOrderItemToOrderItem,
  Order,
  OrderItem,
} from "@/types/shop/order";
import { OrderStatus } from "@/types/shop/orderStatus";
import { PaymentMethod, toDbPaymentMethod } from "@/types/shop/payment";
import {
  CreateProductInput,
  dbProduct,
  mapdbProductToProduct,
  Product,
  ProductChannel,
  ProductVariant,
  ProductVariantInput,
} from "@/types/shop/product";
import { encodeVariantOptionsForStorage } from "@/utils/shop/shopUtils";
import { db_query } from "@/lib/db/connection";
import { cacheTag, revalidateTag } from "next/cache";

export const getAllCategories = async (): Promise<Category[]> => {
  "use cache";
  cacheTag("categories");
  const { rows } = await db_query<Category>("SELECT * FROM neiist.get_all_categories()");
  return rows;
};

export const addCategory = async (name: string): Promise<Category | null> => {
  const {
    rows: [row],
  } = await db_query<dbCategory>(`SELECT * FROM neiist.get_or_create_category($1)`, [name]);
  const result = row ? mapdbCategoryToCategory(row) : null;
  if (result) revalidateTag("categories", "max");
  return result;
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  const { rows } = await db_query<{ delete_category: boolean }>(
    `SELECT neiist.delete_category($1) AS delete_category`,
    [id]
  );
  revalidateTag("categories", "max");
  return rows[0]?.delete_category ?? false;
};

export const getAllProducts = async (
  channel: ProductChannel | "all" | boolean = "all"
): Promise<Product[]> => {
  "use cache";
  cacheTag("products");
  const targetChannel =
    channel === "all" || channel === true || typeof channel !== "string" ? null : channel;
  const { rows } = await db_query<dbProduct>(
    `SELECT * FROM neiist.get_products(NULL::INTEGER, $1::neiist.sales_channel_enum, FALSE::BOOLEAN)`,
    [targetChannel]
  );
  return rows.map(mapdbProductToProduct);
};

export const getAllProductsAdmin = async (): Promise<Product[]> => {
  "use cache";
  cacheTag("products");
  const { rows } = await db_query<dbProduct>(
    `SELECT * FROM neiist.get_products(NULL::INTEGER, NULL::neiist.sales_channel_enum, TRUE::BOOLEAN)`
  );
  return rows.map(mapdbProductToProduct);
};

export const getProductNoCache = async (
  productId: number,
  channel?: ProductChannel
): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(
    `SELECT * FROM neiist.get_products($1::INTEGER, $2::neiist.sales_channel_enum, TRUE::BOOLEAN)`,
    [productId, channel ?? null]
  );
  if (!row) return null;
  return mapdbProductToProduct(row);
};

export const getProduct = async (
  productId: number,
  channel?: ProductChannel
): Promise<Product | null> => {
  "use cache";
  cacheTag("products", `product-${productId}`);
  return getProductNoCache(productId, channel);
};

export const addProduct = async (product: CreateProductInput): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(`SELECT * FROM neiist.create_product($1::JSONB)`, [
    JSON.stringify(product),
  ]);
  const result = row ? mapdbProductToProduct(row) : null;
  if (result) revalidateTag("products", "max");
  return result;
};

export const syncProductVariants = async (
  productId: number,
  variants?: Array<ProductVariantInput | (Partial<ProductVariant> & { id?: number })>,
  variantsToDelete?: Array<number | string>
): Promise<Product | null> => {
  const encodedVariants = (variants ?? []).map((variant) => ({
    id: "id" in variant && variant.id ? Number(variant.id) : undefined,
    sku: variant.sku ?? null,
    images: variant.images ?? [],
    price_modifier:
      ("price_modifier" in variant ? variant.price_modifier : undefined) ??
      ("price_offset" in variant ? variant.price_offset : undefined) ??
      0,
    stock_quantity:
      ("stock_quantity" in variant ? variant.stock_quantity : undefined) ??
      ("stock" in variant ? variant.stock : undefined) ??
      null,
    active: variant.active ?? true,
    options: encodeVariantOptionsForStorage(variant.options ?? {}),
  }));

  const deleteIds = (variantsToDelete ?? []).map(Number).filter((n) => !isNaN(n));

  const {
    rows: [row],
  } = await db_query<dbProduct>(
    "SELECT * FROM neiist.sync_product_variants($1::INTEGER, $2::JSONB, $3::INTEGER[])",
    [productId, JSON.stringify(encodedVariants), deleteIds]
  );
  const result = row ? mapdbProductToProduct(row) : null;
  if (result) {
    revalidateTag("products", "max");
    revalidateTag(`product-${productId}`, "max");
  }
  return result;
};

export const addProductVariants = async (
  productId: number,
  variants: ProductVariantInput[]
): Promise<Product | null> => {
  return syncProductVariants(productId, variants, []);
};

export const addProductVariant = async (
  productId: number,
  variant:
    | ProductVariantInput
    | (Partial<ProductVariant> & {
        price_modifier?: number;
        price_offset?: number;
        stock?: number;
      })
): Promise<Product | null> => {
  return syncProductVariants(productId, [variant], []);
};

export const updateProduct = async (
  productId: number,
  updates: Partial<Product>
): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(`SELECT * FROM neiist.update_product($1, $2::JSONB)`, [
    productId,
    JSON.stringify(updates),
  ]);
  const result = row ? mapdbProductToProduct(row) : null;
  if (result) {
    revalidateTag("products", "max");
    revalidateTag(`product-${productId}`, "max");
  }
  return result;
};

export const deleteProduct = async (productId: number): Promise<boolean> => {
  await db_query(`SELECT neiist.delete_product($1)`, [productId]);
  revalidateTag("products", "max");
  revalidateTag(`product-${productId}`, "max");
  return true;
};

export const deleteProductVariant = async (variantId: number): Promise<boolean> => {
  await db_query(`SELECT neiist.delete_product_variant($1)`, [variantId]);
  revalidateTag("products", "max");
  return true;
};

export const generateOrderNumber = async (): Promise<string> => {
  const {
    rows: [row],
  } = await db_query<{ generate_order_number: string }>(`SELECT neiist.generate_order_number()`);
  return row.generate_order_number;
};

export const createOrder = async (order: CreateOrderInput): Promise<Order | null> => {
  const payload = {
    ...order,
    payment: order.payment
      ? {
          ...order.payment,
          method: toDbPaymentMethod(order.payment.method),
        }
      : order.payment,
  };
  const {
    rows: [row],
  } = await db_query<dbOrder>(`SELECT * FROM neiist.new_order($1::JSONB)`, [
    JSON.stringify(payload),
  ]);
  if (!row) return null;

  const result = mapdbOrderToOrder(row);
  revalidateTag("orders", "max");
  return result;
};

export const getAllOrdersNoCache = async (): Promise<Order[]> => {
  const { rows } = await db_query<dbOrder>(
    `SELECT * FROM neiist.get_orders(NULL::TEXT, NULL::TEXT, NULL::neiist.shop_order_status_enum)`
  );
  return rows.map((row) => mapdbOrderToOrder(row));
};

export const getUserPendingOrders = async (userIstid: string): Promise<Order[]> => {
  const { rows } = await db_query<dbOrder>(
    `SELECT * FROM neiist.get_orders(NULL::TEXT, $1::TEXT, 'pending'::neiist.shop_order_status_enum)`,
    [userIstid]
  );
  return rows.map((row) => mapdbOrderToOrder(row));
};

export const getUserOrders = async (userIstid: string): Promise<Order[]> => {
  "use cache";
  cacheTag("orders", `user-orders-${userIstid}`);
  const { rows } = await db_query<dbOrder>(
    `SELECT * FROM neiist.get_orders(NULL::TEXT, $1::TEXT, NULL::neiist.shop_order_status_enum)`,
    [userIstid]
  );
  return rows.map((row) => mapdbOrderToOrder(row));
};

export const getAllOrders = async (): Promise<Order[]> => {
  "use cache";
  cacheTag("orders");
  return getAllOrdersNoCache();
};

export const getOrderByNumberNoCache = async (orderNumber: string): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrder>(
    `SELECT * FROM neiist.get_orders($1::TEXT, NULL::TEXT, NULL::neiist.shop_order_status_enum)`,
    [orderNumber]
  );
  if (!row) return null;
  return mapdbOrderToOrder(row);
};

export const getOrderByNumber = async (orderNumber: string): Promise<Order | null> => {
  "use cache";
  cacheTag("orders", `order-${orderNumber}`);
  return getOrderByNumberNoCache(orderNumber);
};

export const settleOrdersBatch = async (
  orderNumbers: string[],
  method: PaymentMethod,
  options: {
    shift_id?: string | null;
    by?: string | null;
    reference?: string | null;
  } = {}
): Promise<Order[]> => {
  if (orderNumbers.length === 0) return [];

  const dbMethod = toDbPaymentMethod(method);
  const { rows } = await db_query<dbOrder>(
    `SELECT * FROM neiist.settle_orders($1::TEXT[], $2::neiist.payment_method_enum, $3::UUID, $4, $5)`,
    [
      orderNumbers,
      dbMethod,
      options.shift_id ?? null,
      options.by ?? null,
      options.reference ?? null,
    ]
  );

  revalidateTag("orders", "max");
  for (const num of orderNumbers) {
    revalidateTag(`order-${num}`, "max");
  }

  return rows.map((r) => mapdbOrderToOrder(r));
};

export const getOrderItemById = async (itemId: number): Promise<OrderItem | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrderItem>(`SELECT * FROM neiist.get_order_item($1)`, [itemId]);
  if (!row) return null;
  return mapdbOrderItemToOrderItem(row);
};

export const setOrderItemStatus = async (
  orderItemId: number,
  status: OrderStatus,
  userIstid?: string
): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<{ order_number: string }>(
    `SELECT * FROM neiist.set_order_items_status(ARRAY[$1]::INT[], $2::neiist.shop_order_status_enum, $3)`,
    [orderItemId, status, userIstid ?? null]
  );

  const orderNumber = row?.order_number;
  if (!orderNumber) return null;
  revalidateTag("orders", "max");
  revalidateTag(`order-${orderNumber}`, "max");
  return getOrderByNumber(orderNumber);
};

export const setOrderItemsStatusBatch = async (
  itemIds: number[],
  status: OrderStatus,
  userIstid?: string
): Promise<string[]> => {
  if (itemIds.length === 0) return [];
  const { rows } = await db_query<{ order_number: string }>(
    `SELECT * FROM neiist.set_order_items_status($1::INT[], $2::neiist.shop_order_status_enum, $3)`,
    [itemIds, status, userIstid ?? null]
  );
  revalidateTag("orders", "max");
  for (const row of rows) {
    revalidateTag(`order-${row.order_number}`, "max");
  }
  return rows.map((r) => r.order_number);
};

export const cancelOrder = async (
  orderNumber: string,
  user_istid?: string,
  only_if_pending: boolean = false
): Promise<boolean> => {
  const {
    rows: [row],
  } = await db_query<{ cancel_order: boolean }>(`SELECT neiist.cancel_order($1, $2, $3)`, [
    orderNumber,
    user_istid ?? null,
    only_if_pending,
  ]);
  revalidateTag("orders", "max");
  revalidateTag(`order-${orderNumber}`, "max");
  return Boolean(row?.cancel_order);
};

export const cancelExpiredReservation = async (orderNumber: string): Promise<boolean> => {
  return cancelOrder(orderNumber, "system-expiry", true);
};

export const setOrderState = async (
  orderNumber: string,
  status: OrderStatus,
  user_istid?: string,
  _paymentReference?: string
): Promise<Order | null> => {
  if (status === "cancelled") {
    await cancelOrder(orderNumber, user_istid, false);
    return getOrderByNumber(orderNumber);
  }

  const existingOrder = await getOrderByNumber(orderNumber);
  if (!existingOrder) return null;

  const itemIds = existingOrder.items
    .map((i) => i.id)
    .filter((id): id is number => typeof id === "number");
  if (itemIds.length > 0) {
    await setOrderItemsStatusBatch(itemIds, status, user_istid);
  }
  return getOrderByNumber(orderNumber);
};

export const updateOrderDetails = async (
  orderNumber: string,
  updates: Partial<Order>,
  user_istid?: string
): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrder>(`SELECT * FROM neiist.update_order_details($1, $2::JSONB, $3)`, [
    orderNumber,
    JSON.stringify(updates),
    user_istid ?? null,
  ]);
  revalidateTag("orders", "max");
  revalidateTag(`order-${orderNumber}`, "max");
  return row ? mapdbOrderToOrder(row) : getOrderByNumber(orderNumber);
};

export const updateOrderPayment = async (
  orderNumber: string,
  method: PaymentMethod,
  reference?: string | null,
  user_istid?: string
): Promise<Order | null> => {
  const dbMethod = toDbPaymentMethod(method);
  const {
    rows: [row],
  } = await db_query<dbOrder>(
    `SELECT * FROM neiist.update_order_payment($1, $2::neiist.payment_method_enum, $3, $4)`,
    [orderNumber, dbMethod, reference ?? null, user_istid ?? null]
  );
  revalidateTag("orders", "max");
  revalidateTag(`order-${orderNumber}`, "max");
  return row ? mapdbOrderToOrder(row) : getOrderByNumber(orderNumber);
};

export const updateOrder = async (
  orderNumber: string,
  updates: Partial<Order>,
  _stockOverride: boolean = false,
  user_istid?: string
): Promise<Order | null> => {
  let result: Order | null = null;
  const paymentMethod = updates.payment_method ? updates.payment_method : undefined;
  const paymentRef =
    updates.payment_reference !== undefined ? updates.payment_reference : undefined;

  if (paymentMethod !== undefined) {
    result = await updateOrderPayment(orderNumber, paymentMethod, paymentRef, user_istid);
  } else if (paymentRef !== undefined) {
    const existing = await getOrderByNumber(orderNumber);
    if (!existing?.payment_method) return null;
    result = await updateOrderPayment(orderNumber, existing.payment_method, paymentRef, user_istid);
  }

  const hasOrderDetails = Object.keys(updates).some((k) =>
    [
      "customer_name",
      "customer_email",
      "customer_phone",
      "nif",
      "customer_nif",
      "campus",
      "notes",
      "pickup_deadline",
    ].includes(k)
  );

  if (hasOrderDetails) result = await updateOrderDetails(orderNumber, updates, user_istid);

  if (!result) result = await getOrderByNumber(orderNumber);

  return result;
};

export const getUserOrderedProductsInCategory = async (
  userIstid: string,
  categoryName: string
): Promise<Record<number, number>> => {
  "use cache";
  cacheTag("orders");
  if (!userIstid || !categoryName) return {};
  const { rows } = await db_query<{ product_id: number; total: number }>(
    `SELECT * FROM neiist.get_user_ordered_products_in_category($1, $2)`,
    [userIstid, categoryName]
  );
  const result: Record<number, number> = {};
  for (const row of rows) result[Number(row.product_id)] = Number(row.total ?? 0);
  return result;
};

export const addDiscountCode = async (
  code: DiscountCodeInput | Partial<DiscountCode>
): Promise<DiscountCode | null> => {
  const {
    rows: [row],
  } = await db_query<dbDiscountCode>(`SELECT * FROM neiist.create_discount_code($1::JSONB)`, [
    JSON.stringify(code),
  ]);
  const result = row ? mapdbDiscountCodeToDiscountCode(row) : null;
  if (result) revalidateTag("discount_codes", "max");
  return result;
};

export const updateDiscountCode = async (
  id: number,
  updates: DiscountCodeUpdateInput | Partial<DiscountCode>
): Promise<DiscountCode | null> => {
  const {
    rows: [row],
  } = await db_query<dbDiscountCode>(`SELECT * FROM neiist.update_discount_code($1, $2::JSONB)`, [
    id,
    JSON.stringify(updates),
  ]);
  const result = row ? mapdbDiscountCodeToDiscountCode(row) : null;
  if (result) revalidateTag("discount_codes", "max");
  return result;
};

export const deleteDiscountCode = async (id: number): Promise<boolean> => {
  await db_query(`SELECT neiist.delete_discount_code($1)`, [id]);
  revalidateTag("discount_codes", "max");
  return true;
};

export const getAllDiscountCodes = async (): Promise<DiscountCode[]> => {
  "use cache";
  cacheTag("discount_codes");
  const { rows } = await db_query<dbDiscountCode>(`SELECT * FROM neiist.get_all_discount_codes()`);
  return rows.map(mapdbDiscountCodeToDiscountCode);
};

export const validateDiscountCode = async (
  code: string,
  userIstid: string | null,
  cartItems: Array<{
    product_id: number;
    variant_id?: number | null;
    quantity: number;
  }>
): Promise<DiscountValidationResult | null> => {
  const {
    rows: [row],
  } = await db_query<DiscountValidationResult>(
    `SELECT * FROM neiist.validate_discount_code($1, $2, $3)`,
    [code, userIstid, JSON.stringify(cartItems)]
  );
  return row ?? null;
};
