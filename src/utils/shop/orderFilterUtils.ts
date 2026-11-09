import { Order } from "@/types/shop/order";
import { Product } from "@/types/shop/product";
import {
  isColorKey,
  splitNameHex,
  matchesSelections,
  decodeVariantOptionsFromStorage,
} from "@/utils/shop/shopUtils";
import { CascadeFilterOption, getCascadeLeafIds } from "@neiist/ui";

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
      const opts = decodeVariantOptionsFromStorage(variant.options || {});
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
      const opts = decodeVariantOptionsFromStorage(item.variant_options || {});
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

export function buildCascadeFilterTree(
  orders: Order[] = [],
  products: Product[] = []
): CascadeFilterOption[] {
  const productList = buildProductCascadeList(orders, products);

  return productList.map((p) => {
    if (p.optionKeys.length === 0 || p.variants.length === 0) {
      return {
        id: encode({ name: p.name, selections: {} }),
        label: p.name,
        price: p.price,
      };
    }

    function buildLevel(
      keyIndex: number,
      currentSelections: Record<string, string>,
      branchIdPrefix: string
    ): CascadeFilterOption[] {
      const currentKey = p.optionKeys[keyIndex];
      if (!currentKey) return [];

      const valuesSet = new Set<string>();
      for (const variant of p.variants) {
        if (matchesSelections(variant.options, currentSelections) && variant.options[currentKey]) {
          valuesSet.add(variant.options[currentKey]);
        }
      }

      const isLastKey = keyIndex === p.optionKeys.length - 1;
      const nextKey = !isLastKey ? p.optionKeys[keyIndex + 1] : undefined;

      return Array.from(valuesSet)
        .sort((a, b) => a.localeCompare(b))
        .map((val) => {
          const nextSelections = { ...currentSelections, [currentKey]: val };
          const cleanLabel = isColorKey(currentKey) ? splitNameHex(val).name || val : val;
          const currentBranchId = `${branchIdPrefix}-${currentKey}-${val}`;

          if (isLastKey) {
            return {
              id: encode({ name: p.name, selections: nextSelections }),
              label: cleanLabel,
            };
          }

          return {
            id: currentBranchId,
            label: cleanLabel,
            levelLabel: nextKey,
            children: buildLevel(keyIndex + 1, nextSelections, currentBranchId),
          };
        });
    }

    return {
      id: p.name,
      label: p.name,
      price: p.price,
      levelLabel: p.optionKeys[0],
      children: buildLevel(0, {}, p.name),
    };
  });
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

export interface FilterSummaryItem {
  id: string;
  label: string;
  leafIds: string[];
}

export function summarizeProductFilterTags(
  selectedLeafIds: string[],
  cascadeTree: CascadeFilterOption[]
): FilterSummaryItem[] {
  if (!selectedLeafIds.length || !cascadeTree.length) return [];

  const selectedSet = new Set(selectedLeafIds);
  const result: FilterSummaryItem[] = [];

  for (const product of cascadeTree) {
    const productLeaves = getCascadeLeafIds(product);
    if (!productLeaves.length) continue;

    if (productLeaves.every((id) => selectedSet.has(id))) {
      result.push({
        id: product.id,
        label: product.label,
        leafIds: productLeaves,
      });
      continue;
    }

    if (!product.children?.length) {
      if (productLeaves.some((id) => selectedSet.has(id))) {
        result.push({
          id: product.id,
          label: product.label,
          leafIds: productLeaves,
        });
      }
      continue;
    }

    for (const child of product.children) {
      const childLeaves = getCascadeLeafIds(child);
      if (!childLeaves.length) continue;

      if (childLeaves.every((id) => selectedSet.has(id))) {
        result.push({
          id: child.id,
          label: `${product.label} (${child.label})`,
          leafIds: childLeaves,
        });
        continue;
      }

      if (child.children?.length) {
        for (const subChild of child.children) {
          const subLeaves = getCascadeLeafIds(subChild);
          if (subLeaves.every((id) => selectedSet.has(id))) {
            result.push({
              id: subChild.id,
              label: `${product.label} (${child.label} › ${subChild.label})`,
              leafIds: subLeaves,
            });
          }
        }
      } else if (childLeaves.some((id) => selectedSet.has(id))) {
        result.push({
          id: child.id,
          label: `${product.label} (${child.label})`,
          leafIds: childLeaves,
        });
      }
    }
  }

  return result;
}
