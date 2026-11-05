import { getRedisClient } from "@/lib/redis/client";
import { RESERVE_STOCK_HOLD_LUA, RELEASE_STOCK_HOLD_LUA } from "@/lib/redis/scripts";
import { StockHoldItem, StockRequestItem } from "@/types/redis";
import { DatabaseError } from "@/types/errors";
import type { Product } from "@/types/shop/product";

export class InsufficientStockError extends Error {
  constructor(message = "Stock insuficiente para um ou mais artigos selecionados.") {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export function getHoldKey(productId: number, variantId?: number | null): string {
  return `stock:hold:${productId}:${variantId ?? 0}`;
}

/**
 * Check and map Limited stock items to their current PostgreSQL stock.
 */
export function toStockRequests(
  items: StockRequestItem[],
  products: Map<number, Product>
): { reqs: StockHoldItem[]; pgStocks: Record<string, number> } {
  const byKey = new Map<string, StockHoldItem>();
  const pgStocks: Record<string, number> = {};

  for (const item of items) {
    const product = products.get(item.product_id);
    if (!product || product.stock_type !== "limited") continue;

    let stockQty: number;
    if (item.variant_id != null) {
      const variant = product.variants?.find((v) => v.id === item.variant_id);
      if (!variant) throw new DatabaseError("Variante inválida ou inativa.", 400);
      stockQty = Number(variant.stock_quantity ?? 0);
    } else {
      stockQty = Number(product.stock_quantity ?? 0);
    }

    const key = getHoldKey(item.product_id, item.variant_id);
    pgStocks[key] = stockQty;

    const qty = item.quantity ?? 1;
    const existing = byKey.get(key);
    if (existing) {
      existing.quantity += qty;
    } else {
      byKey.set(key, {
        productId: item.product_id,
        variantId: item.variant_id ?? null,
        quantity: qty,
      });
    }
  }

  return { reqs: Array.from(byKey.values()), pgStocks };
}

/**
 * Reserve temporary stock hold of items if not all in stock rolls back
 */
export async function reserveStockHolds(
  orderNumber: string,
  items: StockHoldItem[],
  pgStocks: Record<string, number>,
  ttlSeconds = 1800
): Promise<boolean> {
  if (items.length === 0) return true;

  const redis = getRedisClient();
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  const acquiredHolds: StockHoldItem[] = [];

  try {
    for (const item of items) {
      const key = getHoldKey(item.productId, item.variantId);
      const pgStock = pgStocks[key] ?? 0;

      const result = await redis.eval(
        RESERVE_STOCK_HOLD_LUA,
        1,
        key,
        now.toString(),
        expiresAt.toString(),
        orderNumber,
        item.quantity.toString(),
        pgStock.toString()
      );

      if (Number(result) !== 1) {
        await releaseStockHolds(orderNumber, acquiredHolds).catch((err) =>
          console.warn("[holds] failed to rollback holds:", err)
        );
        return false;
      }

      acquiredHolds.push(item);
    }
  } catch (error) {
    if (acquiredHolds.length > 0) {
      await releaseStockHolds(orderNumber, acquiredHolds).catch((releaseErr) =>
        console.warn("[holds] failed to rollback holds after error:", releaseErr)
      );
    }
    throw error;
  }

  return true;
}

/**
 * Releases temporary stock hold
 */
export async function releaseStockHolds(
  orderNumber: string,
  items: Array<{ productId: number; variantId?: number | null }>
): Promise<void> {
  if (items.length === 0) return;

  const redis = getRedisClient();

  const promises = items.map((item) => {
    const key = getHoldKey(item.productId, item.variantId);
    return redis.eval(RELEASE_STOCK_HOLD_LUA, 1, key, orderNumber);
  });

  await Promise.all(promises);
}

/**
 * Atomic stock reservation, for on time live orders that won't expire
 *
 */
export async function withStock<T>(
  orderNumber: string,
  items: StockRequestItem[],
  products: Map<number, Product>,
  ttlSeconds: number,
  create: () => Promise<T>
): Promise<T> {
  const { reqs, pgStocks } = toStockRequests(items, products);

  if (reqs.length > 0) {
    const held = await reserveStockHolds(orderNumber, reqs, pgStocks, ttlSeconds);
    if (!held) throw new InsufficientStockError();
  }

  try {
    return await create();
  } finally {
    if (reqs.length > 0) {
      await releaseStockHolds(orderNumber, reqs).catch((err) =>
        console.warn("[holds] failed to release hold in finally:", err)
      );
    }
  }
}
