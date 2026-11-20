/**
 * Integer-cents monetary arithmetic utilities
 * Ensures TypeScript code never performs IEEE-754 floating-point arithmetic on money values
 */

/**
 * Converts a numeric amount or string decimal (19.99 or "19.99") to integer cents (1999)
 */
export function toCents(amount: number | string | null | undefined): number {
  if (amount == null) return 0;
  const num = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer cents (1999) back to standard Euro float amount (19.99)
 */
export function fromCents(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/**
 * Parses a PostgreSQL NUMERIC string representation (or number) into a 2-decimal number
 */
export function parseDbNumeric(val: string | number | null | undefined): number {
  if (val == null) return 0;
  if (typeof val === "number") return Number(val.toFixed(2));
  const num = Number(val);
  return Number.isNaN(num) ? 0 : Number(num.toFixed(2));
}

/**
 * Adds multiple monetary amounts
 */
export function addMoney(...amounts: Array<number | string | null | undefined>): number {
  const totalCents = amounts.reduce<number>((acc, curr) => acc + toCents(curr), 0);
  return fromCents(totalCents);
}

/**
 * Subtracts money
 */
export function subtractMoney(
  a: number | string | null | undefined,
  b: number | string | null | undefined
): number {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Unit price (base + variant modifier) using integer cents arithmetic
 */
export function unitPriceMoney(
  basePrice: number | string | null | undefined,
  modifierPrice?: number | string | null
): number {
  return fromCents(toCents(basePrice) + toCents(modifierPrice));
}

/**
 * Formats a numeric Euro amount consistently as "12.50€"
 */
export function formatMoney(amount: number | string | null | undefined): string {
  return `${fromCents(toCents(amount)).toFixed(2)}€`;
}

/**
 * Calculates line total for base price + modifier price * quantity
 */
export function lineTotalMoney(
  basePrice: number | string | null | undefined,
  modifierPrice: number | string | null | undefined,
  quantity: number
): number {
  const unitCents = toCents(basePrice) + toCents(modifierPrice);
  return fromCents(unitCents * quantity);
}

const EURO_DENOMINATIONS: Array<{ value: number; label: string }> = [
  { value: 50, label: "50 €" },
  { value: 20, label: "20 €" },
  { value: 10, label: "10 €" },
  { value: 5, label: "5 €" },
  { value: 2, label: "2 €" },
  { value: 1, label: "1 €" },
  { value: 0.5, label: "50 c" },
  { value: 0.2, label: "20 c" },
  { value: 0.1, label: "10 c" },
  { value: 0.05, label: "5 c" },
  { value: 0.02, label: "2 c" },
  { value: 0.01, label: "1 c" },
];

/**
 * Calculates a greedy breakdown of change into standard Euro bills and coins
 */
export function calculateChangeDenominations(changeAmount: number): string | null {
  let cents = toCents(changeAmount);
  if (cents <= 0) return null;

  const parts: string[] = [];

  for (const denom of EURO_DENOMINATIONS) {
    const denomCents = toCents(denom.value);
    if (cents >= denomCents) {
      const count = Math.floor(cents / denomCents);
      cents %= denomCents;
      parts.push(`${count} × ${denom.label}`);
    }
  }

  if (parts.length === 0) return null;
  return `Entregar ao cliente: ${parts.join(" + ")}`;
}

/**
 * Generates quick shortcut cash payment amounts for a given order total
 */
export function getCashShortcutAmounts(totalAmount: number): number[] {
  const total = fromCents(toCents(totalAmount));
  if (total <= 0) return [0];

  const candidates = [
    total,
    Math.ceil(total),
    Math.floor(total / 5) * 5 + 5,
    Math.floor(total / 10) * 10 + 10,
    20,
    50,
    100,
  ];

  return Array.from(new Set(candidates))
    .filter((n) => n >= total)
    .sort((a, b) => a - b)
    .slice(0, 4);
}
