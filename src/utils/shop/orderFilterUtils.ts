import { Order } from "@/types/shop/order";
import { Product } from "@/types/shop/product";
import { isColorKey, splitNameHex } from "@/utils/shop/shopUtils";

export interface CascadeVariant {
  id: number;
  label: string;
  options: Record<string, string>;
}

export interface ProductCascadeItem {
  name: string;
  price?: number;
  optionKeys: string[];
  variants: CascadeVariant[];
}

export interface ProductFilter {
  name: string;
  selections: Record<string, string>;
}

const encode = (filter: ProductFilter): string => JSON.stringify(filter);
const decode = (encoded: string): ProductFilter => JSON.parse(encoded) as ProductFilter;

const normalize = (value?: string) => value?.replace(/["'\\]/g, "").trim() ?? "";

export const matchesSelections = (
  variantOptions: Record<string, string> = {},
  selections: Record<string, string>
) =>
  Object.entries(selections).every(
    ([key, value]) => normalize(variantOptions[key]) === normalize(value)
  );

type ProductEntry = { price?: number; variants: Map<string, CascadeVariant> };

function getOrCreateEntry(
  map: Map<string, ProductEntry>,
  name: string,
  price?: number
): ProductEntry {
  if (!map.has(name)) map.set(name, { price, variants: new Map() });
  return map.get(name)!;
}

export function buildProductCascadeList(
  orders: Order[] = [],
  products: Product[] = []
): ProductCascadeItem[] {
  const map = new Map<string, ProductEntry>();

  for (const product of products) {
    if (!product.name) continue;
    const entry = getOrCreateEntry(map, product.name, product.price);
    if (product.price != null) entry.price = product.price;
    for (const variant of product.variants || []) {
      const opts = variant.options || {};
      entry.variants.set(JSON.stringify(opts), {
        id: variant.id,
        label: variant.label || "",
        options: opts,
      });
    }
  }

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.product_name) continue;
      const entry = getOrCreateEntry(map, item.product_name, item.unit_price);
      const opts = item.variant_options || {};
      const key = JSON.stringify(opts);
      if (!entry.variants.has(key))
        entry.variants.set(key, {
          id: item.variant_id ?? 0,
          label: item.variant_label ?? "",
          options: opts,
        });
    }
  }

  return Array.from(map.keys())
    .sort((nameA, nameB) => nameA.localeCompare(nameB))
    .map((name) => {
      const entry = map.get(name)!;
      const variants = Array.from(entry.variants.values());
      const seenKeys = new Set<string>();
      const optionKeys: string[] = [];
      for (const variant of variants) {
        for (const optKey of Object.keys(variant.options)) {
          if (!seenKeys.has(optKey)) {
            seenKeys.add(optKey);
            optionKeys.push(optKey);
          }
        }
      }
      return { name, price: entry.price, optionKeys: optionKeys.sort(), variants };
    });
}

export function getValuesForCascade(
  product: ProductCascadeItem,
  selections: Record<string, string>
): string[] {
  const nextKey = product.optionKeys[Object.keys(selections).length];
  if (!nextKey) return [];
  const values = new Set<string>();
  for (const variant of product.variants) {
    if (matchesSelections(variant.options, selections) && variant.options[nextKey])
      values.add(variant.options[nextKey]);
  }
  return Array.from(values).sort();
}

export function matchesProductFilter(order: Order, selected: string[]): boolean {
  if (!selected.length) return true;
  const filters = selected.map(decode);
  return order.items.some((item) =>
    filters.some(({ name, selections }) => {
      if (name !== item.product_name) return false;
      if (!Object.keys(selections).length) return true;
      return matchesSelections(item.variant_options || {}, selections);
    })
  );
}

export function getProductFilterDisplayLabel(encoded: string): string {
  const { name, selections } = decode(encoded);
  const entries = Object.entries(selections);
  if (!entries.length) return name;
  const labels = entries.map(([key, value]) =>
    isColorKey(key) ? splitNameHex(value).name || value : value
  );
  return `${name} (${labels.join(" › ")})`;
}

function isExactMatch(
  filterSelections: Record<string, string>,
  selections: Record<string, string>
): boolean {
  return (
    matchesSelections(filterSelections, selections) &&
    matchesSelections(selections, filterSelections)
  );
}

export function getCascadeSelectionState(
  product: ProductCascadeItem,
  selections: Record<string, string>,
  selected: string[]
): { isChecked: boolean; isIndeterminate: boolean } {
  if (!selected.length) return { isChecked: false, isIndeterminate: false };

  const filtersForProduct = selected.map(decode).filter((filter) => filter.name === product.name);

  const isFullyCovered = filtersForProduct.some(
    (filter) =>
      !Object.keys(filter.selections).length || isExactMatch(filter.selections, selections)
  );
  if (isFullyCovered) return { isChecked: true, isIndeterminate: false };

  const matchingVariants = product.variants.filter((variant) =>
    matchesSelections(variant.options, selections)
  );
  if (!matchingVariants.length) return { isChecked: false, isIndeterminate: false };

  const checkedCount = matchingVariants.filter((variant) =>
    filtersForProduct.some((filter) => matchesSelections(variant.options, filter.selections))
  ).length;

  if (checkedCount === matchingVariants.length) return { isChecked: true, isIndeterminate: false };
  if (checkedCount > 0) return { isChecked: false, isIndeterminate: true };
  return { isChecked: false, isIndeterminate: false };
}

export function toggleCascadeSelection(
  product: ProductCascadeItem,
  selections: Record<string, string>,
  selected: string[]
): string[] {
  const { isChecked, isIndeterminate } = getCascadeSelectionState(product, selections, selected);

  const next = selected.filter((encoded) => {
    const filter = decode(encoded);
    if (filter.name !== product.name) return true;
    if (!Object.keys(selections).length) return false;
    return !matchesSelections(filter.selections, selections);
  });

  if (!isChecked && !isIndeterminate) next.push(encode({ name: product.name, selections }));
  return next;
}

export function isCurrentAcademicYear(dateInput: string | Date, now = new Date()): boolean {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return false;
  const currentYear = now.getFullYear();
  const startOfSchoolYear = new Date(now.getMonth() >= 8 ? currentYear : currentYear - 1, 8, 1);
  return date >= startOfSchoolYear;
}
