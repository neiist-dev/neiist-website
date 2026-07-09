import { getMbWayNumberForOrder } from "@/lib/mbwayNumbers";
import { Category, dbCategory, mapdbCategoryToCategory } from "@/types/shop/category";
import {
  DiscountCode,
  DiscountCodeInput,
  DiscountCodeUpdateInput,
  DiscountValidationResult,
  dbDiscountCode,
  mapdbDiscountCodeToDiscountCode,
} from "@/types/shop/discountCode";
import { Order, dbOrder, mapdbOrderToOrder } from "@/types/shop/order";
import { SPECIAL_CATEGORIES } from "@/types/shop/orderKind";
import { OrderStatus } from "@/types/shop/orderStatus";
import {
  Product,
  ProductVariant,
  dbProduct,
  dbProductVariant,
  decodeVariantOptionsFromStorage,
  encodeVariantOptionsForStorage,
  mapdbProductToProduct,
} from "@/types/shop/product";
import { isSpecialCategory } from "@/utils/shop/orderKindUtils";

import { db_query } from "@/utils/db/dbClient";

export const addProduct = async (
  product: Partial<Product> & {
    name: string;
    price: number;
    stock_type: Product["stock_type"];
    active?: boolean;
  }
): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(`SELECT * FROM neiist.add_product($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
    product.name,
    product.description ?? null,
    product.price,
    product.images ?? [],
    product.category ?? null,
    product.stock_type,
    product.stock_quantity ?? null,
    product.order_deadline ?? null,
    product.active ?? true,
  ]);
  return row ? mapdbProductToProduct(row) : null;
};

export const addProductVariant = async (
  productId: number,
  variant: Partial<ProductVariant> & { price_modifier?: number }
): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(`SELECT * FROM neiist.add_product_variant($1,$2,$3,$4,$5,$6,$7)`, [
    productId,
    variant.sku ?? null,
    variant.images ?? [],
    variant.price_modifier ?? 0,
    variant.stock_quantity ?? null,
    variant.active ?? true,
    JSON.stringify(encodeVariantOptionsForStorage(variant.options ?? {})),
  ]);
  return row ? mapdbProductToProduct(row) : null;
};

export const getAllProducts = async (includeSpecial: boolean = false): Promise<Product[]> => {
  const { rows } = await db_query<dbProduct>(`SELECT * FROM neiist.get_all_products()`);
  const products = rows.map(mapdbProductToProduct);
  return includeSpecial
    ? products
    : products.filter((product) => !isSpecialCategory(product.category));
};

export const getAllProductsAdmin = async (): Promise<Product[]> => {
  const { rows } = await db_query<dbProduct>(
    `SELECT * FROM neiist.get_all_products_including_archived()`
  );
  return rows.map(mapdbProductToProduct);
};

export const deleteProduct = async (productId: number): Promise<void> => {
  await db_query(`SELECT neiist.delete_product($1)`, [productId]);
};

export const deleteProductVariant = async (variantId: number): Promise<void> => {
  await db_query(`SELECT neiist.delete_product_variant($1)`, [variantId]);
};

export const getProduct = async (productId: number): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(`SELECT * FROM neiist.get_product($1)`, [productId]);
  return row ? mapdbProductToProduct(row) : null;
};

export const updateProduct = async (
  productId: number,
  updates: Partial<Product> & { category?: string; active?: boolean }
): Promise<Product | null> => {
  const {
    rows: [row],
  } = await db_query<dbProduct>(`SELECT * FROM neiist.update_product($1,$2)`, [
    productId,
    JSON.stringify(updates),
  ]);
  return row ? mapdbProductToProduct(row) : null;
};

export const updateProductVariant = async (
  variantId: number,
  updates: Partial<ProductVariant>
): Promise<ProductVariant | null> => {
  const {
    rows: [row],
  } = await db_query<dbProductVariant>(`SELECT * FROM neiist.update_product_variant($1,$2)`, [
    variantId,
    JSON.stringify({
      sku: updates.sku,
      images: updates.images,
      price_modifier: updates.price_modifier,
      stock_quantity:
        updates.stock_quantity == null ? null : Math.round(Number(updates.stock_quantity)),
      active: updates.active,
      options: encodeVariantOptionsForStorage(updates.options ?? {}),
    }),
  ]);
  return row
    ? {
        id: row.id,
        sku: row.sku ?? undefined,
        images: row.images ?? undefined,
        price_modifier: Number(row.price_modifier ?? 0),
        stock_quantity: row.stock_quantity ?? undefined,
        active: row.active,
        options: decodeVariantOptionsFromStorage(row.options),
        label: row.label ?? undefined,
      }
    : null;
};

export const getAllDiscountCodes = async (): Promise<DiscountCode[]> => {
  const { rows } = await db_query<dbDiscountCode>(`SELECT * FROM neiist.get_all_discount_codes()`);
  return rows.map(mapdbDiscountCodeToDiscountCode);
};

export const createDiscountCode = async (
  discountCode: DiscountCodeInput
): Promise<DiscountCode | null> => {
  const {
    rows: [row],
  } = await db_query<dbDiscountCode>(
    `SELECT * FROM neiist.add_discount_code($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      discountCode.code,
      discountCode.discount_type,
      discountCode.discount_value,
      discountCode.valid_product_ids ?? null,
      discountCode.valid_istids ?? null,
      discountCode.max_uses ?? null,
      discountCode.expires_at ?? null,
      discountCode.active ?? true,
    ]
  );
  return row ? mapdbDiscountCodeToDiscountCode(row) : null;
};

export const updateDiscountCode = async (
  discountCodeId: number,
  updates: DiscountCodeUpdateInput
): Promise<DiscountCode | null> => {
  const {
    rows: [row],
  } = await db_query<dbDiscountCode>(`SELECT * FROM neiist.update_discount_code($1, $2)`, [
    discountCodeId,
    JSON.stringify(updates),
  ]);
  return row ? mapdbDiscountCodeToDiscountCode(row) : null;
};

export const deleteDiscountCode = async (discountCodeId: number): Promise<boolean> => {
  await db_query(`SELECT neiist.delete_discount_code($1)`, [discountCodeId]);
  return true;
};

export const validateDiscountCode = async (
  code: string,
  userIstid: string | null,
  cartItems: Array<{ product_id: number; variant_id?: number | null; quantity: number }>
): Promise<DiscountValidationResult | null> => {
  const {
    rows: [row],
  } = await db_query<DiscountValidationResult>(
    `SELECT * FROM neiist.validate_discount_code($1, $2, $3)`,
    [code, userIstid ?? null, JSON.stringify(cartItems)]
  );
  return row ?? null;
};

export const newOrder = async (
  order: Partial<Order> & {
    user_istid?: string;
    items: Array<{ product_id: number; variant_id?: number; quantity: number }>;
    discount_code?: string | null;
  },
  stockOverride: boolean = false
): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrder>(
    `SELECT * FROM neiist.new_order($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      order.user_istid ?? null,
      order.customer_name ?? null,
      order.customer_email ?? null,
      order.customer_phone ?? null,
      order.customer_nif ?? null,
      order.campus ?? null,
      order.notes ?? null,
      order.payment_method ?? null,
      order.payment_reference ?? null,
      order.created_by ?? null,
      JSON.stringify(
        order.items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id ?? null,
          quantity: i.quantity,
        }))
      ),
      order.discount_code ?? null,
      stockOverride,
    ]
  );
  return row
    ? {
        ...mapdbOrderToOrder(row),
        mbway_number: getMbWayNumberForOrder(row.order_number),
      }
    : null;
};

export const getAllOrders = async (): Promise<Order[]> => {
  const { rows } = await db_query<dbOrder>(`SELECT * FROM neiist.get_all_orders()`);
  return rows.map((row) => ({
    ...mapdbOrderToOrder(row),
    mbway_number: getMbWayNumberForOrder(row.order_number),
  }));
};

export const getOrderById = async (orderId: number): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrder>(`SELECT * FROM neiist.get_order($1, NULL)`, [orderId]);
  return row
    ? {
        ...mapdbOrderToOrder(row),
        mbway_number: getMbWayNumberForOrder(row.order_number),
      }
    : null;
};

export const getOrderByNumber = async (orderNumber: string): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrder>(`SELECT * FROM neiist.get_order($1, NULL)`, [orderNumber]);
  return row
    ? {
        ...mapdbOrderToOrder(row),
        mbway_number: getMbWayNumberForOrder(row.order_number),
      }
    : null;
};

export const getUserOrderedProductsInCategory = async (
  userIstid: string,
  categoryName: string
): Promise<Record<number, number>> => {
  if (!userIstid || !categoryName) return {};
  const { rows } = await db_query<{ product_id: number; total: number }>(
    `SELECT * FROM neiist.get_user_ordered_products_in_category($1, $2)`,
    [userIstid, categoryName]
  );
  const result: Record<number, number> = {};
  for (const row of rows) result[Number(row.product_id)] = Number(row.total ?? 0);
  return result;
};

export const updateOrder = async (
  orderId: number,
  updates: Partial<Order>,
  stockOverride: boolean = false,
  user_istid?: string
): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrder>(`SELECT * FROM neiist.update_order($1,$2,$3,$4)`, [
    orderId,
    JSON.stringify(updates),
    stockOverride,
    user_istid ?? null,
  ]);
  return row ? mapdbOrderToOrder(row) : null;
};

export const setOrderState = async (
  orderId: number,
  status: OrderStatus,
  user_istid?: string
): Promise<Order | null> => {
  const {
    rows: [row],
  } = await db_query<dbOrder>(`SELECT * FROM neiist.set_order_state($1,$2,$3)`, [
    orderId,
    status,
    user_istid ?? null,
  ]);
  return row ? mapdbOrderToOrder(row) : null;
};

export const getAllCategories = async (includeSpecial: boolean = false): Promise<Category[]> => {
  await Promise.all(SPECIAL_CATEGORIES.map((categoryName) => addCategory(categoryName)));
  try {
    const { rows } = await db_query<Category>("SELECT * FROM neiist.get_all_categories()");
    return includeSpecial ? rows : rows.filter((category) => !isSpecialCategory(category.name));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const addCategory = async (name: string): Promise<Category | null> => {
  const {
    rows: [row],
  } = await db_query<dbCategory>(`SELECT * FROM neiist.get_or_create_category($1)`, [name]);
  return row ? mapdbCategoryToCategory(row) : null;
};
