import { getProduct, validateDiscountCode } from "@/lib/db/repositories/shop.repository";
import type { StockRequestItem } from "@/types/redis";
import type { OrderSource } from "@/types/shop/order";
import type { Product, ProductChannel, ValidateProductRulesOptions } from "@/types/shop/product";
import { addMoney, lineTotalMoney, subtractMoney } from "@/utils/shop/moneyUtils";

/**
 * Validates channel, stock-type, and product-type mixing/ticket rules across all shop channels.
 */
export function validateProductRules(
  products: Product[],
  items: Array<{ quantity?: number }>,
  orderSource: OrderSource,
  options: ValidateProductRulesOptions = {}
): string | null {
  const { orderUserIstid = null, enforceChannel = true, enforceTicketRules = true } = options;
  const isFastPos = orderSource === "fast-pos";

  if (enforceChannel) {
    const disallowed = products.find((p) => !p.channels?.includes(orderSource));
    if (disallowed)
      return `O produto "${disallowed.name}" não está disponível para encomenda no canal ${orderSource}.`;
  }

  if (isFastPos && products.some((p) => p.stock_type !== "untracked"))
    return "Apenas produtos com stock untracked podem ser vendidos no balcão rápido";

  const hasTickets = products.some((p) => p.product_type === "event_ticket");
  const hasMerchandise = products.some((p) => p.product_type === "merchandise");
  const hasFoodDrink = products.some((p) => p.product_type === "food_drink");

  if (hasFoodDrink && !isFastPos) return "Produtos alimentares apenas disponíveis no balcão rápido";

  if (hasTickets && (hasMerchandise || hasFoodDrink))
    return "Bilhetes de eventos não podem ser encomendados juntamente com outros produtos";

  if (enforceTicketRules && hasTickets) {
    if (!orderUserIstid) return "A compra de bilhetes requer a identificação do estudante (IST ID)";

    const totalTickets = items.reduce((sum, it) => sum + (it.quantity ?? 1), 0);
    if (totalTickets > 1) return "Apenas é permitido 1 bilhete por utilizador";
  }

  return null;
}

/**
 * Validates cart items, product rules, and discount codes on the server and returns authoritative pricing.
 */
export async function validateAndPriceCartItems(
  itemsInput: StockRequestItem[],
  options: {
    channel?: ProductChannel;
    userIstid?: string | null;
    discountCode?: string | null;
    enforceChannel?: boolean;
    enforceTicketRules?: boolean;
  } = {}
): Promise<
  | { isValid: true; finalAmount: number; productsMap: Map<number, Product> }
  | { isValid: false; error: string }
> {
  const {
    channel = "web",
    userIstid = null,
    discountCode = null,
    enforceChannel = true,
    enforceTicketRules = true,
  } = options;

  if (!itemsInput || itemsInput.length === 0)
    return { isValid: false, error: "O carrinho está vazio." };

  const productIds = Array.from(new Set(itemsInput.map((it) => it.product_id)));
  const fetchedProducts = await Promise.all(productIds.map((id) => getProduct(id)));

  if (fetchedProducts.some((p) => p == null))
    return { isValid: false, error: "Produto inválido no pedido." };

  const products = fetchedProducts as Product[];
  const productsMap = new Map<number, Product>(products.map((p) => [p.id, p]));

  const ruleError = validateProductRules(products, itemsInput, channel, {
    orderUserIstid: userIstid,
    enforceChannel,
    enforceTicketRules,
  });
  if (ruleError) return { isValid: false, error: ruleError };

  let calculatedTotal = 0;
  for (const it of itemsInput) {
    const prod = productsMap.get(it.product_id)!;
    const variant = it.variant_id
      ? (prod.variants?.find((v) => v.id === it.variant_id) ?? null)
      : null;
    const lineTotal = lineTotalMoney(prod.price, variant?.price_modifier ?? 0, it.quantity ?? 1);
    calculatedTotal = addMoney(calculatedTotal, lineTotal);
  }

  let discountAmount = 0;
  const cleanCode = typeof discountCode === "string" ? discountCode.trim() : "";
  if (cleanCode) {
    const validation = await validateDiscountCode(
      cleanCode,
      userIstid,
      itemsInput.map((it) => ({
        product_id: it.product_id,
        variant_id: it.variant_id ?? null,
        quantity: it.quantity ?? 1,
      }))
    );

    if (!validation?.is_valid)
      return {
        isValid: false,
        error: validation?.error || "Invalid discount code.",
      };

    discountAmount = Math.min(calculatedTotal, Number(validation.discount_amount) || 0);
  }

  return {
    isValid: true,
    finalAmount: Math.max(0, subtractMoney(calculatedTotal, discountAmount)),
    productsMap,
  };
}
