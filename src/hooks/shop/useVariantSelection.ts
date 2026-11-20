"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/types/shop/product";
import { unitPriceMoney } from "@/utils/shop/moneyUtils";
import {
  findItemVariant,
  getDistinctOptionValues,
  getProductImages,
  getProductOptionNames,
  matchesSelections,
  normalizeOptionValue,
} from "@/utils/shop/shopUtils";

function buildInitialSelection(product: Product | null, optionNames: string[]) {
  const init: Record<string, string> = {};
  if (!product) return init;
  optionNames.forEach((name) => {
    init[name] = normalizeOptionValue(product.variants[0]?.options?.[name]);
  });
  return init;
}

export function useVariantSelection(product: Product | null) {
  const productId = product?.id ?? null;

  const optionNames = useMemo(
    () => (product ? getProductOptionNames(product.variants) : []),
    [product]
  );

  const [selectionState, setSelectionState] = useState<{
    productId: number | null;
    values: Record<string, string>;
  }>(() => ({
    productId,
    values: buildInitialSelection(product, optionNames),
  }));

  const selected = useMemo(
    () =>
      selectionState.productId === productId
        ? selectionState.values
        : buildInitialSelection(product, optionNames),
    [selectionState, productId, product, optionNames]
  );

  const availableValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (!product) return result;
    optionNames.forEach((name, idx) => {
      const priorSelections = Object.fromEntries(
        optionNames.slice(0, idx).map((prior) => [prior, selected[prior] ?? ""])
      );
      const matching = product.variants.filter((v) =>
        matchesSelections(v.options, priorSelections)
      );
      result[name] = getDistinctOptionValues(matching, name);
    });
    return result;
  }, [product, optionNames, selected]);

  useEffect(() => {
    setSelectionState((prev) => {
      const base =
        prev.productId === productId ? prev.values : buildInitialSelection(product, optionNames);
      const next = { ...base };
      let changed = prev.productId !== productId;
      optionNames.forEach((name) => {
        const vals = availableValues[name] ?? [];
        if (vals.length > 0 && !vals.includes(next[name])) {
          next[name] = vals[0];
          changed = true;
        }
      });
      return changed ? { productId, values: next } : prev;
    });
  }, [availableValues, optionNames, product, productId]);

  const handleSelect = useCallback(
    (optionName: string, value: string) => {
      setSelectionState((prev) => {
        const base =
          prev.productId === productId ? prev.values : buildInitialSelection(product, optionNames);
        return { productId, values: { ...base, [optionName]: value } };
      });
    },
    [productId, product, optionNames]
  );

  const selectedVariant = useMemo(() => {
    if (!product || optionNames.length === 0) return undefined;
    return findItemVariant(product, { variant_options: selected });
  }, [product, optionNames, selected]);

  const allImages = useMemo(() => (product ? getProductImages(product) : []), [product]);

  const getVariantImageIndex = useCallback(
    (variant?: ProductVariant): number => {
      if (!variant?.images?.length) return 0;
      const idx = allImages.indexOf(variant.images[0]);
      return idx >= 0 ? idx : 0;
    },
    [allImages]
  );

  const [imgIndex, setImgIndex] = useState(() => getVariantImageIndex(product?.variants[0]));

  useEffect(() => {
    setImgIndex(getVariantImageIndex(selectedVariant));
  }, [productId, selectedVariant, getVariantImageIndex]);

  const price = useMemo(() => {
    if (!product) return 0;
    return unitPriceMoney(product.price, selectedVariant?.price_modifier);
  }, [product, selectedVariant]);

  return {
    optionNames,
    selected,
    availableValues,
    handleSelect,
    selectedVariant,
    allImages,
    imgIndex,
    setImgIndex,
    price,
  };
}
