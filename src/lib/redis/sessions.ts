import { getRedisClient } from "@/lib/redis/client";
import { releaseStockHolds } from "@/lib/redis/holds";
import { CheckoutSessionData } from "@/types/redis";

const SESSION_PREFIX = "checkout:session:";
const CART_PREFIX = "checkout:cart:";

export async function saveCheckoutSession(
  session: CheckoutSessionData,
  ttlSeconds = 1800
): Promise<void> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${session.order_number}`;
  if (!session.expires_at) {
    session.expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  }
  await redis.set(key, JSON.stringify(session), "EX", ttlSeconds);
}

export async function getCheckoutSession(orderNumber: string): Promise<CheckoutSessionData | null> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${orderNumber}`;
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as CheckoutSessionData;
  } catch {
    return null;
  }
}

export async function deleteCheckoutSession(orderNumber: string): Promise<void> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${orderNumber}`;
  await redis.del(key);
}

export async function discardCheckoutSession(orderNumber: string): Promise<boolean> {
  const session = await getCheckoutSession(orderNumber);
  if (!session) return false;

  if (Array.isArray(session.items) && session.items.length > 0) {
    const holdItems = session.items.map((it) => ({
      productId: it.product_id,
      variantId: it.variant_id ?? null,
    }));
    await releaseStockHolds(orderNumber, holdItems);
  }
  await deleteCheckoutSession(orderNumber);
  return true;
}

export async function getCartIdOrderNumber(cartId: string): Promise<string | null> {
  const redis = getRedisClient();
  return redis.get(`${CART_PREFIX}${cartId}`);
}

export async function setCartIdOrderNumber(
  cartId: string,
  orderNumber: string,
  ttlSeconds = 3600
): Promise<void> {
  const redis = getRedisClient();
  await redis.set(`${CART_PREFIX}${cartId}`, orderNumber, "EX", ttlSeconds);
}
