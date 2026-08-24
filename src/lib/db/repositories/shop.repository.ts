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
import { OrderStatus } from "@/types/shop/orderStatus";
import { SPECIAL_CATEGORIES } from "@/types/shop/orderKind";
import { isSpecialCategory } from "@/utils/shop/orderKindUtils";
import {
  Product,
  ProductVariant,
  dbProduct,
  dbProductVariant,
  decodeVariantOptionsFromStorage,
  encodeVariantOptionsForStorage,
  mapdbProductToProduct,
} from "@/types/shop/product";

import { db_query } from "@/lib/db/connection";
import { cacheTag, revalidateTag } from "next/cache";

export interface ProductVariantInput {
  name?: string;
  sku?: string;
  images?: string[];
  options?: Record<string, string>;
  price_offset?: number;
  price_modifier?: number;
  stock?: number;
  stock_quantity?: number;
  active?: boolean;
}

export const getAllCategories = async (includeSpecial: boolean = false): Promise<Category[]> => {
  "use cache";
  cacheTag("categories");
  try {
    const { rows } = await db_query<Category>("SELECT * FROM neiist.get_all_categories()");
    return includeSpecial ? rows : rows.filter((category) => !isSpecialCategory(category.name));
  } catch (error) {
    console.error("[getAllCategories] Error fetching categories:", error);
    return [];
  }
};

export const addCategory = async (name: string): Promise<Category | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<dbCategory>(`SELECT * FROM neiist.get_or_create_category($1)`, [name]);
    const result = row ? mapdbCategoryToCategory(row) : null;
    if (result) revalidateTag("categories", "max");
    return result;
  } catch (error) {
    console.error("[addCategory] Error adding category:", error);
    return null;
  }
};

// Explicit seeding function
export const seedSpecialCategories = async (): Promise<void> => {
  try {
    await Promise.all(
      SPECIAL_CATEGORIES.map((name: string) =>
        db_query(`SELECT * FROM neiist.get_or_create_category($1)`, [name])
      )
    );
  } catch (error) {
    console.error("[seedSpecialCategories] Failed to seed special categories:", error);
  }
};

export const getAllProducts = async (includeSpecial: boolean = false): Promise<Product[]> => {
  "use cache";
  cacheTag("products");
  try {
    const { rows } = await db_query<dbProduct>(`SELECT * FROM neiist.get_all_products()`);
    const products = rows.map(mapdbProductToProduct);
    return includeSpecial
      ? products
      : products.filter((product) => !isSpecialCategory(product.category));
  } catch (error) {
    console.error("[getAllProducts] Error fetching products:", error);
    return [];
  }
};

export const getAllProductsAdmin = async (): Promise<Product[]> => {
  "use cache";
  cacheTag("products");
  try {
    const { rows } = await db_query<dbProduct>(
      `SELECT * FROM neiist.get_all_products_including_archived()`
    );
    return rows.map(mapdbProductToProduct);
  } catch (error) {
    console.error(
      "[getAllProductsAdmin] Error fetching all products including archived ones:",
      error
    );
    return [];
  }
};

export const getProduct = async (productId: number): Promise<Product | null> => {
  "use cache";
  cacheTag("products", `product-${productId}`);
  try {
    const {
      rows: [row],
    } = await db_query<dbProduct>(`SELECT * FROM neiist.get_product($1)`, [productId]);
    return row ? mapdbProductToProduct(row) : null;
  } catch (error) {
    console.error("[getProduct] Error fetching product:", error);
    return null;
  }
};

export const addProduct = async (
  product: Partial<Product> & {
    name: string;
    price: number;
    stock_type: Product["stock_type"];
    active?: boolean;
  }
): Promise<Product | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<dbProduct>(
      `SELECT * FROM neiist.add_product($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        product.name,
        product.description ?? null,
        product.price,
        product.images ?? [],
        product.category ?? null,
        product.stock_type,
        product.stock_quantity ?? null,
        product.order_deadline ?? null,
        product.active ?? true,
        product.order_start ?? null,
      ]
    );
    const result = row ? mapdbProductToProduct(row) : null;
    if (result) {
      revalidateTag("products", "max");
      revalidateTag(`product-${result.id}`, "max");
    }
    return result;
  } catch (error) {
    console.error("[addProduct] Error adding product:", error);
    return null;
  }
};

export const addProductVariants = async (
  productId: number,
  variants: ProductVariantInput[]
): Promise<Product | null> => {
  try {
    if (!variants || variants.length === 0) return await getProduct(productId);
    const encodedVariants = variants.map((variant) => ({
      sku: variant.sku ?? null,
      images: variant.images ?? [],
      price_modifier: variant.price_modifier ?? variant.price_offset ?? 0,
      stock_quantity: variant.stock_quantity ?? variant.stock ?? null,
      active: variant.active ?? true,
      options: encodeVariantOptionsForStorage(variant.options ?? {}),
    }));
    const {
      rows: [row],
    } = await db_query<dbProduct>(
      "SELECT * FROM neiist.add_product_variants($1::INTEGER, $2::JSONB)",
      [productId, JSON.stringify(encodedVariants)]
    );
    const result = row ? mapdbProductToProduct(row) : null;
    if (result) {
      revalidateTag("products", "max");
      revalidateTag(`product-${productId}`, "max");
    }
    return result;
  } catch (error) {
    console.error("[addProductVariants] Error batch inserting product variants:", error);
    return null;
  }
};

export const addProductVariant = async (
  productId: number,
  variant:
    | ProductVariantInput
    | (Partial<ProductVariant> & { price_modifier?: number; price_offset?: number; stock?: number })
): Promise<Product | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<dbProduct>(
      `SELECT * FROM neiist.add_product_variant($1, $2, $3, $4, $5, $6, $7)`,
      [
        productId,
        variant.sku ?? null,
        variant.images ?? [],
        variant.price_modifier ?? variant.price_offset ?? 0,
        variant.stock_quantity ?? variant.stock ?? null,
        variant.active ?? true,
        JSON.stringify(encodeVariantOptionsForStorage(variant.options ?? {})),
      ]
    );
    const result = row ? mapdbProductToProduct(row) : null;
    if (row) {
      revalidateTag("products", "max");
      revalidateTag(`product-${productId}`, "max");
    }
    return result;
  } catch (error) {
    console.error("[addProductVariant] Error adding product variant:", error);
    return null;
  }
};

export const updateProduct = async (
  productId: number,
  updates: Partial<Product>
): Promise<Product | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<dbProduct>(`SELECT * FROM neiist.update_product($1, $2)`, [
      productId,
      JSON.stringify(updates),
    ]);
    const result = row ? mapdbProductToProduct(row) : null;
    if (result) {
      revalidateTag("products", "max");
      revalidateTag(`product-${productId}`, "max");
    }
    return result;
  } catch (error) {
    console.error("[updateProduct] Error updating product:", error);
    return null;
  }
};

export const updateProductVariant = async (
  variantId: number,
  updates: Partial<ProductVariant>
): Promise<ProductVariant | null> => {
  try {
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
    const result = row
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
    if (result) revalidateTag("products", "max");
    return result;
  } catch (error) {
    console.error("[updateProductVariant] Error updating product variant:", error);
    return null;
  }
};

export const deleteProduct = async (productId: number): Promise<boolean> => {
  try {
    await db_query(`SELECT neiist.delete_product($1)`, [productId]);
    revalidateTag("products", "max");
    revalidateTag(`product-${productId}`, "max");
    return true;
  } catch (error) {
    console.error("[deleteProduct] Error deleting product:", error);
    return false;
  }
};

export const deleteProductVariant = async (variantId: number): Promise<boolean> => {
  try {
    await db_query(`SELECT neiist.delete_product_variant($1)`, [variantId]);
    revalidateTag("products", "max");
    return true;
  } catch (error) {
    console.error("[deleteProductVariant] Error deleting product variant:", error);
    return false;
  }
};

export const newOrder = async (
  order: Partial<Order> & {
    user_istid?: string;
    items: Array<{ product_id: number; variant_id?: number; quantity: number }>;
    discount_code?: string | null;
    created_by?: string | null;
  },
  stockOverride: boolean = false
): Promise<Order | null> => {
  try {
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
          (order.items || []).map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id ?? null,
            quantity: item.quantity,
          }))
        ),
        order.discount_code ?? null,
        stockOverride,
      ]
    );
    const result = row
      ? {
          ...mapdbOrderToOrder(row),
          mbway_number: getMbWayNumberForOrder(row.order_number),
        }
      : null;
    if (result) revalidateTag("orders", "max");
    return result;
  } catch (error) {
    console.error("[newOrder] Error creating order:", error);
    return null;
  }
};

export const getAllOrdersUncached = async (): Promise<Order[]> => {
  try {
    const { rows } = await db_query<dbOrder>(`SELECT * FROM neiist.get_all_orders()`);
    return rows.map((row) => ({
      ...mapdbOrderToOrder(row),
      mbway_number: getMbWayNumberForOrder(row.order_number),
    }));
  } catch (error) {
    console.error("[getAllOrdersUncached] Error fetching uncached orders:", error);
    return [];
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  "use cache";
  cacheTag("orders");
  return getAllOrdersUncached();
};

export const getOrderById = async (orderId: number): Promise<Order | null> => {
  "use cache";
  cacheTag("orders");
  try {
    const {
      rows: [row],
    } = await db_query<dbOrder>(`SELECT * FROM neiist.get_order($1, NULL)`, [orderId]);
    return row
      ? {
          ...mapdbOrderToOrder(row),
          mbway_number: getMbWayNumberForOrder(row.order_number),
        }
      : null;
  } catch (error) {
    console.error("[getOrderById] Error fetching order by ID:", error);
    return null;
  }
};

export const getOrderByNumber = async (orderNumber: string): Promise<Order | null> => {
  "use cache";
  cacheTag("orders");
  try {
    const {
      rows: [row],
    } = await db_query<dbOrder>(`SELECT * FROM neiist.get_order(NULL, $1)`, [orderNumber]);
    return row
      ? {
          ...mapdbOrderToOrder(row),
          mbway_number: getMbWayNumberForOrder(row.order_number),
        }
      : null;
  } catch (error) {
    console.error("[getOrderByNumber] Error fetching order by number:", error);
    return null;
  }
};

export const getOrderByIdOrNumber = async (idOrNumber: string | number): Promise<Order | null> => {
  const num = Number(idOrNumber);
  if (Number.isInteger(num) && num > 0) {
    const order = await getOrderById(num);
    if (order) return order;
  }
  return getOrderByNumber(String(idOrNumber));
};

export const updateOrder = async (
  orderId: number,
  updates: Partial<Order>,
  stockOverride: boolean = false,
  user_istid?: string
): Promise<Order | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<dbOrder>(`SELECT * FROM neiist.update_order($1,$2,$3,$4)`, [
      orderId,
      JSON.stringify(updates),
      stockOverride,
      user_istid ?? null,
    ]);
    const result = row ? mapdbOrderToOrder(row) : null;
    if (result) revalidateTag("orders", "max");
    return result;
  } catch (error) {
    console.error("[updateOrder] Error updating order:", error);
    return null;
  }
};

export const setOrderState = async (
  orderId: number,
  status: OrderStatus,
  user_istid?: string
): Promise<Order | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<dbOrder>(`SELECT * FROM neiist.set_order_state($1,$2,$3)`, [
      orderId,
      status,
      user_istid ?? null,
    ]);
    const result = row ? mapdbOrderToOrder(row) : null;
    if (result) revalidateTag("orders", "max");
    return result;
  } catch (error) {
    console.error("[setOrderState] Error setting order state:", error);
    return null;
  }
};

export const getUserOrderedProductsInCategory = async (
  userIstid: string,
  categoryName: string
): Promise<Record<number, number>> => {
  "use cache";
  cacheTag("orders");
  if (!userIstid || !categoryName) return {};
  try {
    const { rows } = await db_query<{ product_id: number; total: number }>(
      `SELECT * FROM neiist.get_user_ordered_products_in_category($1, $2)`,
      [userIstid, categoryName]
    );
    const result: Record<number, number> = {};
    for (const row of rows) result[Number(row.product_id)] = Number(row.total ?? 0);
    return result;
  } catch (error) {
    console.error("[getUserOrderedProductsInCategory] Error fetching ordered products:", error);
    return {};
  }
};

export const addDiscountCode = async (
  code: DiscountCodeInput | Partial<DiscountCode>
): Promise<DiscountCode | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<dbDiscountCode>(
      `SELECT * FROM neiist.add_discount_code($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        code.code,
        code.discount_type,
        code.discount_value,
        code.valid_product_ids ?? null,
        code.valid_istids ?? null,
        code.max_uses ?? null,
        code.expires_at ?? null,
        code.active ?? true,
      ]
    );
    const result = row ? mapdbDiscountCodeToDiscountCode(row) : null;
    if (result) revalidateTag("discount_codes", "max");
    return result;
  } catch (error) {
    console.error("[addDiscountCode] Error adding discount code:", error);
    return null;
  }
};

export const createDiscountCode = addDiscountCode;

export const updateDiscountCode = async (
  id: number,
  updates: DiscountCodeUpdateInput | Partial<DiscountCode>
): Promise<DiscountCode | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<dbDiscountCode>(`SELECT * FROM neiist.update_discount_code($1, $2)`, [
      id,
      JSON.stringify(updates),
    ]);
    const result = row ? mapdbDiscountCodeToDiscountCode(row) : null;
    if (result) revalidateTag("discount_codes", "max");
    return result;
  } catch (error) {
    console.error("[updateDiscountCode] Error updating discount code:", error);
    return null;
  }
};

export const deleteDiscountCode = async (id: number): Promise<boolean> => {
  try {
    await db_query(`SELECT neiist.delete_discount_code($1)`, [id]);
    revalidateTag("discount_codes", "max");
    return true;
  } catch (error) {
    console.error("[deleteDiscountCode] Error deleting discount code:", error);
    return false;
  }
};

export const getAllDiscountCodes = async (): Promise<DiscountCode[]> => {
  "use cache";
  cacheTag("discount_codes");
  try {
    const { rows } = await db_query<dbDiscountCode>(
      `SELECT * FROM neiist.get_all_discount_codes()`
    );
    return rows.map(mapdbDiscountCodeToDiscountCode);
  } catch (error) {
    console.error("[getAllDiscountCodes] Error fetching discount codes:", error);
    return [];
  }
};

export const validateDiscountCode = async (
  code: string,
  userIstid: string | null,
  cartItems: Array<{ product_id: number; variant_id?: number | null; quantity: number }>
): Promise<DiscountValidationResult | null> => {
  "use cache";
  cacheTag("discount_codes");
  try {
    const {
      rows: [row],
    } = await db_query<DiscountValidationResult>(
      `SELECT * FROM neiist.validate_discount_code($1, $2, $3)`,
      [code, userIstid, JSON.stringify(cartItems)]
    );
    return row ?? null;
  } catch (error) {
    console.error("[validateDiscountCode] Error validating discount code:", error);
    return null;
  }
};

export const getStalePendingOrders = async (thresholdMs: number): Promise<Order[]> => {
  try {
    const { rows } = await db_query<dbOrder>(
      "SELECT * FROM neiist.get_stale_pending_orders($1::BIGINT)",
      [thresholdMs]
    );
    return rows.map(mapdbOrderToOrder);
  } catch (error) {
    console.error("[getStalePendingOrders] Error fetching stale pending orders:", error);
    return [];
  }
};

/**
 * Background-only: cancels an order without calling revalidateTag.
 * Used exclusively by the autoCancelScheduler which runs outside a request context.
 * Cache is naturally refreshed on the next request-context write or page visit.
 */
export const cancelOrderBackground = async (
  orderId: number,
  user_istid: string = "system-cron"
): Promise<Order | null> => {
  try {
    const {
      rows: [row],
    } = await db_query<dbOrder>(`SELECT * FROM neiist.set_order_state($1,$2,$3)`, [
      orderId,
      "cancelled",
      user_istid,
    ]);
    return row ? mapdbOrderToOrder(row) : null;
  } catch (error) {
    console.error("[cancelOrderBackground] Error cancelling order:", error);
    return null;
  }
};
