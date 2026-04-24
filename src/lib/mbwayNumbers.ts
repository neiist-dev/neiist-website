const MAX_MBWAY_USES_PER_NUMBER = 30;

const MBWAY_NUMBERS = String(process.env.MBWAY_NUMBERS ?? "")
  .split(",")
  .map((number) => number.trim())
  .filter(Boolean);

const MBWAY_ALLOCATION_POOL = MBWAY_NUMBERS.flatMap((number) =>
  Array.from({ length: MAX_MBWAY_USES_PER_NUMBER }, () => number)
);

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getMbWayNumberForOrder(orderNumber: string): string | null {
  if (MBWAY_ALLOCATION_POOL.length === 0) return null;

  const poolIndex = hashString(orderNumber) % MBWAY_ALLOCATION_POOL.length;
  return MBWAY_ALLOCATION_POOL[poolIndex];
}
